let todoTasks: TodoTask[] = [];
let scheduledTasksCalendarId: string;

let tokenClient: google.accounts.oauth2.TokenClient;
const API_KEY = 'AIzaSyDEXH13-t4iuBSNV2LY4fMu5Lh4588aj5Q';
const CLIENT_ID = '62639704487-hmupba0vgj1ectuaqso2oa6r467q3gh8.apps.googleusercontent.com';
const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest', 'https://www.googleapis.com/discovery/v1/apis/tasks/v1/rest'];
const SCOPES = 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/tasks.readonly';

document.addEventListener('DOMContentLoaded', async () => {
	document.getElementById('authorize_button').addEventListener('click', authorize);
	document.getElementById('schedule_tasks_button').addEventListener('click', scheduleTasks);
});

async function authorize() {
	gapi.load('client', async () => {
		await gapi.client.init({
			apiKey: API_KEY,
			discoveryDocs: DISCOVERY_DOCS,
		})
	}
	);

	tokenClient = google.accounts.oauth2.initTokenClient({
		client_id: CLIENT_ID,
		scope: SCOPES,
		callback: showTasks
	});
	tokenClient.requestAccessToken({ prompt: 'consent' });
}

class TodoTask {
	task: gapi.client.tasks.Task;
	duration: number;
	constructor(task: gapi.client.tasks.Task) {
		this.task = task;
		this.duration = +task.notes;
	}
}

async function showTasks() {
	document.getElementById('schedule_tasks_button').style.visibility = 'hidden';
	document.getElementById('signout_button').style.visibility = 'visible';
	let response;

	try {
		response = await gapi.client.tasks.tasklists.list();
	}
	catch (err) {
		if (err instanceof Error)
			document.getElementById('content').innerText = err.message;
		return;
	}

	const taskLists = response.result.items;
	if (taskLists.length === 0) {
		document.getElementById('content').innerText = 'No tasks found.';
		return;
	}
	let myTasksId;
	taskLists.forEach((task) => {
		if (task.title === 'My Tasks') {
			myTasksId = task.id;
		}
	});

	if (!myTasksId) {
		document.getElementById('content').innerText = 'My Tasks not found.';
		return;
	}

	try {
		response = await gapi.client.tasks.tasks.list({
			tasklist: myTasksId,
			showCompleted: false
		});
		let tasks = response.result.items;
		if (tasks.length === 0) {
			document.getElementById('content').innerText = 'No tasks found.';
			return;
		}
		document.getElementById('content').innerText = '';
		tasks.forEach((task) => {
			let todoTask = new TodoTask(task);
			todoTasks.push(todoTask);
			document.getElementById('content').innerText += task.title + '\n';
		});
	} catch (err) {
		if (err instanceof Error)
			document.getElementById('content').innerText = err.message;
	}

	document.getElementById('schedule_tasks_button').style.visibility = 'visible';
	document.getElementById('authorize_button').innerText = 'Refresh';
}

class TimeSlot {
	start;
	end;
	constructor(start: Date, end: Date) {
		this.start = start;
		this.end = end;
	}

	// Get duration in minutes
	getDuration() {
		let duration = this.end.getTime() - this.start.getTime();
		return duration / 60000;
	}
}

class EventSchedule {
	events: gapi.client.calendar.Event[];
	constructor(events: gapi.client.calendar.Event[]) {
		this.events = events;
		this.events.sort((a, b) => {
			return new Date(a.end.dateTime) > new Date(b.end.dateTime) ? 1 : -1;
		});
	}

	async findScheduling(todoTask: TodoTask, duration: number, startDate: Date, endDate: Date) {
		let durationRemaining = duration;
		let availableTimeSlots = this.getAvailableTimeSlots(startDate, endDate);
		for (let timeSlot = 0; timeSlot < availableTimeSlots.length && durationRemaining > 0; timeSlot++) {
			if (availableTimeSlots[timeSlot].getDuration() >= durationRemaining) {
				let scheduledTimeSlot = new TimeSlot(availableTimeSlots[timeSlot].start, new Date(availableTimeSlots[timeSlot].start.getTime() + durationRemaining * 60000));
				await this.schedule(todoTask, scheduledTimeSlot);
				durationRemaining = 0;
			} else {
				await this.schedule(todoTask, availableTimeSlots[timeSlot]);
				durationRemaining -= availableTimeSlots[timeSlot].getDuration();
			}
		}

		return duration - durationRemaining;
	}

	async schedule(todoTask: TodoTask, timeSlot: TimeSlot) {
		let previousEvent = this.getPreviousEvent(timeSlot.start);
		if (previousEvent && previousEvent.summary === todoTask.task.title) {
			try {
				await gapi.client.calendar.events.update({
					calendarId: scheduledTasksCalendarId,
					eventId: previousEvent.id,
					resource: {
						summary: previousEvent.summary,
						description: previousEvent.description,
						start: {
							dateTime: previousEvent.start.dateTime,
							timeZone: 'America/Los_Angeles'
						},
						end: {
							dateTime: timeSlot.end.toISOString(),
							timeZone: 'America/Los_Angeles'
						}
					}
				});
				previousEvent.end.dateTime = timeSlot.end.toISOString();
			} catch (err) {
				if (err instanceof Error)
					document.getElementById('content').innerText = err.message;
			}
		} else {
			let event: gapi.client.calendar.Event = {
				summary: todoTask.task.title,
				start: {
					dateTime: timeSlot.start.toISOString(),
					timeZone: 'America/Los_Angeles'
				},
				end: {
					dateTime: timeSlot.end.toISOString(),
					timeZone: 'America/Los_Angeles'
				}
			};


			// Save to Google Calendar
			try {
				let response = await gapi.client.calendar.events.insert({
					calendarId: scheduledTasksCalendarId,
					resource: event
				});
				event = response.result;
				event.start.dateTime = timeSlot.start.toISOString();
				event.end.dateTime = timeSlot.end.toISOString();
				this.events.push(event);
				this.events.sort((a, b) => {
					return new Date(a.end.dateTime) > new Date(b.end.dateTime) ? 1 : -1;
				});
			} catch (err) {
				if (err instanceof Error)
					document.getElementById('content').innerText = err.message;
			}
		}

	}

	getPreviousEvent(startDate: Date) {
		let previousEvent = this.events.find((event) => {
			let end = new Date(event.end.dateTime);
			return end.getFullYear() === startDate.getFullYear() &&
				end.getMonth() === startDate.getMonth() &&
				end.getDate() === startDate.getDate() &&
				end.getHours() === startDate.getHours() &&
				end.getMinutes() === startDate.getMinutes() &&
				end.getSeconds() === startDate.getSeconds();
		});
		return previousEvent;
	}

	getAvailableTimeSlots(startDate: Date, endDate: Date) {
		let timeSlots = [];

		let eventsWithinTimeframe: gapi.client.calendar.Event[] = [];
		this.events.forEach((event) => {
			if ((new Date(event.start.dateTime) >= startDate && new Date(event.start.dateTime) <= endDate)
				|| (new Date(event.end.dateTime) >= startDate && new Date(event.end.dateTime) <= endDate)) {
				eventsWithinTimeframe.push(event);
			} else if (event.recurrence && event.recurrence.at(0) == 'RRULE:FREQ=DAILY') {
				let start = new Date(event.start.dateTime);
				start.setUTCFullYear(startDate.getUTCFullYear());
				start.setUTCMonth(startDate.getUTCMonth());
				start.setUTCDate(startDate.getUTCDate());
				let end = new Date(event.end.dateTime);
				end.setUTCFullYear(startDate.getUTCFullYear());
				end.setUTCMonth(startDate.getUTCMonth());
				end.setUTCDate(startDate.getUTCDate());
				if (start > end) {
					end.setDate(end.getDate() + 1);
				}

				if ((start >= startDate && start <= endDate)
					|| (end >= startDate && end <= endDate)) {
					let newEvent = {
						summary: event.summary,
						start: {
							dateTime: start.toISOString(),
							timeZone: 'America/Los_Angeles'
						},
						end: {
							dateTime: end.toISOString(),
							timeZone: 'America/Los_Angeles'
						}
					}
					eventsWithinTimeframe.push(newEvent);
				} else {
					start.setDate(start.getDate() + 1);
					end.setDate(end.getDate() + 1);
					if ((start >= startDate && start <= endDate)
						|| (end >= startDate && end <= endDate)) {
						let newEvent = {
							summary: event.summary,
							start: {
								dateTime: start.toISOString(),
							},
							end: {
								dateTime: end.toISOString(),
							}
						}
						eventsWithinTimeframe.push(newEvent);
					}
				}
			}
		});

		eventsWithinTimeframe.sort((a, b) => {
			return new Date(a.start.dateTime) > new Date(b.start.dateTime) ? 1 : -1;
		});

		// If no events, return 1 all day time slot
		if (eventsWithinTimeframe.length === 0) {
			timeSlots.push(new TimeSlot(startDate, endDate));
			return timeSlots;
		}
		for (let e = 0; e < eventsWithinTimeframe.length; e++) {
			if (e < (eventsWithinTimeframe.length - 1) && new Date(eventsWithinTimeframe[e].end.dateTime) < new Date(eventsWithinTimeframe[e + 1].start.dateTime)) {
				timeSlots.push(new TimeSlot(new Date(eventsWithinTimeframe[e].end.dateTime), new Date(eventsWithinTimeframe[e + 1].start.dateTime)));
			}

			if (e == 0 && new Date(eventsWithinTimeframe[e].start.dateTime) > startDate) {
				timeSlots.push(new TimeSlot(startDate, new Date(eventsWithinTimeframe[e].start.dateTime)));
			}
			if (new Date(eventsWithinTimeframe[e].end.dateTime) > endDate) {
				return timeSlots;
			}
		}
		if (new Date(eventsWithinTimeframe[eventsWithinTimeframe.length - 1].end.dateTime) < endDate) {
			timeSlots.push(new TimeSlot(new Date(eventsWithinTimeframe[eventsWithinTimeframe.length - 1].end.dateTime), endDate));
		}
		return timeSlots;

	}

}

async function scheduleTasks() {
	console.log('Scheduling tasks...');
	let response;
	try {
		response = await gapi.client.calendar.calendarList.list();
	} catch (err) {
		if (err instanceof Error)
			document.getElementById('content').innerText = err.message;
		return;
	}

	let calendars = response.result.items;
	if (!calendars || calendars.length == 0) {
		document.getElementById('content').innerText = 'No events found.';
		return;
	}
	let events: gapi.client.calendar.Event[] = [];
	for (const calendar of calendars) {
		if (calendar.summary == "Scheduled Tasks") {
			scheduledTasksCalendarId = calendar.id;
		} else {
			response = await gapi.client.calendar.events.list({
				'calendarId': calendar.id,
				'timeMin': (new Date()).toISOString()
			});
			events = events.concat(response.result.items);
		}
	}

	if (!scheduledTasksCalendarId) {
		try {
			response = await gapi.client.calendar.calendars.insert({
				resource: {
					summary: "Scheduled Tasks"
				}
			});
		} catch (err) {
			if (err instanceof Error)
				document.getElementById('content').innerText = err.message;
			return;
		}
		response = await gapi.client.calendar.calendarList.list();
		calendars = response.result.items;
		calendars.forEach((calendar) => {
			if (calendar.summary == "Scheduled Tasks") {
				scheduledTasksCalendarId = calendar.id;
			}
		});
	} else {
		response = await gapi.client.calendar.events.list({
			'calendarId': scheduledTasksCalendarId
		});
		let scheduledEvents = response.result.items;
		for (let event of scheduledEvents) {
			await gapi.client.calendar.events.delete({
				'calendarId': scheduledTasksCalendarId,
				'eventId': event.id
			});
		}
	}

	let eventSchedule = new EventSchedule(events);
	todoTasks.sort((a, b) => {
		return a.task.due > b.task.due ? 1 : -1;
	});

	for (const todoTask of todoTasks) {
		let currentStartDate = new Date();
		let currentEndDate = new Date();
		currentEndDate.setDate(currentEndDate.getDate() + 1);
		currentEndDate.setHours(0, 0, 0, 0);
		let timeLeftToSchedule = todoTask.duration;
		while (timeLeftToSchedule > 0) {
			let durationScheduled = await eventSchedule.findScheduling(todoTask, Math.min(30, timeLeftToSchedule), currentStartDate, currentEndDate);
			timeLeftToSchedule -= durationScheduled;
			currentStartDate.setDate(currentStartDate.getDate() + 1);
			currentStartDate.setHours(0, 0, 0, 0);
			currentEndDate.setDate(currentEndDate.getDate() + 1);
			if (currentStartDate > new Date(todoTask.task.due)) {
				currentStartDate = new Date();
				currentEndDate = new Date();
				currentEndDate.setDate(currentEndDate.getDate() + 1);
				currentEndDate.setHours(0, 0, 0, 0);
			}
			if (currentEndDate > new Date(todoTask.task.due)) {
				currentEndDate = new Date(todoTask.task.due);
			}
		}
	}

}