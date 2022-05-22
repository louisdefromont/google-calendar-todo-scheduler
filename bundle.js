/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/index.ts":
/*!**********************!*\
  !*** ./src/index.ts ***!
  \**********************/
/***/ (function() {


var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
let todoTasks = [];
let scheduledTasksCalendarId;
let tokenClient;
const API_KEY = 'AIzaSyDEXH13-t4iuBSNV2LY4fMu5Lh4588aj5Q';
const CLIENT_ID = '62639704487-hmupba0vgj1ectuaqso2oa6r467q3gh8.apps.googleusercontent.com';
const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest', 'https://www.googleapis.com/discovery/v1/apis/tasks/v1/rest'];
const SCOPES = 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/tasks.readonly';
document.addEventListener('DOMContentLoaded', () => __awaiter(void 0, void 0, void 0, function* () {
    document.getElementById('authorize_button').addEventListener('click', authorize);
    document.getElementById('schedule_tasks_button').addEventListener('click', scheduleTasks);
}));
function authorize() {
    return __awaiter(this, void 0, void 0, function* () {
        gapi.load('client', () => __awaiter(this, void 0, void 0, function* () {
            yield gapi.client.init({
                apiKey: API_KEY,
                discoveryDocs: DISCOVERY_DOCS,
            });
        }));
        tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: CLIENT_ID,
            scope: SCOPES,
            callback: showTasks
        });
        tokenClient.requestAccessToken({ prompt: 'consent' });
    });
}
class TodoTask {
    constructor(task) {
        this.task = task;
        this.duration = +task.notes;
    }
}
function showTasks() {
    return __awaiter(this, void 0, void 0, function* () {
        document.getElementById('schedule_tasks_button').style.visibility = 'hidden';
        document.getElementById('signout_button').style.visibility = 'visible';
        let response;
        try {
            response = yield gapi.client.tasks.tasklists.list();
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
            response = yield gapi.client.tasks.tasks.list({
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
        }
        catch (err) {
            if (err instanceof Error)
                document.getElementById('content').innerText = err.message;
        }
        document.getElementById('schedule_tasks_button').style.visibility = 'visible';
        document.getElementById('authorize_button').innerText = 'Refresh';
    });
}
class TimeSlot {
    constructor(start, end) {
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
    constructor(events) {
        this.events = events;
        this.events.sort((a, b) => {
            return new Date(a.end.dateTime) > new Date(b.end.dateTime) ? 1 : -1;
        });
    }
    findScheduling(todoTask, duration, startDate, endDate) {
        return __awaiter(this, void 0, void 0, function* () {
            let durationRemaining = duration;
            let availableTimeSlots = this.getAvailableTimeSlots(startDate, endDate);
            for (let timeSlot = 0; timeSlot < availableTimeSlots.length && durationRemaining > 0; timeSlot++) {
                if (availableTimeSlots[timeSlot].getDuration() >= durationRemaining) {
                    let scheduledTimeSlot = new TimeSlot(availableTimeSlots[timeSlot].start, new Date(availableTimeSlots[timeSlot].start.getTime() + durationRemaining * 60000));
                    yield this.schedule(todoTask, scheduledTimeSlot);
                    durationRemaining = 0;
                }
                else {
                    yield this.schedule(todoTask, availableTimeSlots[timeSlot]);
                    durationRemaining -= availableTimeSlots[timeSlot].getDuration();
                }
            }
            return duration - durationRemaining;
        });
    }
    schedule(todoTask, timeSlot) {
        return __awaiter(this, void 0, void 0, function* () {
            let previousEvent = this.getPreviousEvent(timeSlot.start);
            if (previousEvent && previousEvent.summary === todoTask.task.title) {
                try {
                    yield gapi.client.calendar.events.update({
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
                }
                catch (err) {
                    if (err instanceof Error)
                        document.getElementById('content').innerText = err.message;
                }
            }
            else {
                let event = {
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
                    let response = yield gapi.client.calendar.events.insert({
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
                }
                catch (err) {
                    if (err instanceof Error)
                        document.getElementById('content').innerText = err.message;
                }
            }
        });
    }
    getPreviousEvent(startDate) {
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
    getAvailableTimeSlots(startDate, endDate) {
        let timeSlots = [];
        let eventsWithinTimeframe = [];
        this.events.forEach((event) => {
            if ((new Date(event.start.dateTime) >= startDate && new Date(event.start.dateTime) <= endDate)
                || (new Date(event.end.dateTime) >= startDate && new Date(event.end.dateTime) <= endDate)) {
                eventsWithinTimeframe.push(event);
            }
            else if (event.recurrence && event.recurrence.at(0) == 'RRULE:FREQ=DAILY') {
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
                    };
                    eventsWithinTimeframe.push(newEvent);
                }
                else {
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
                        };
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
function scheduleTasks() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Scheduling tasks...');
        let response;
        try {
            response = yield gapi.client.calendar.calendarList.list();
        }
        catch (err) {
            if (err instanceof Error)
                document.getElementById('content').innerText = err.message;
            return;
        }
        let calendars = response.result.items;
        if (!calendars || calendars.length == 0) {
            document.getElementById('content').innerText = 'No events found.';
            return;
        }
        let events = [];
        for (const calendar of calendars) {
            if (calendar.summary == "Scheduled Tasks") {
                scheduledTasksCalendarId = calendar.id;
            }
            else {
                response = yield gapi.client.calendar.events.list({
                    'calendarId': calendar.id,
                    'timeMin': (new Date()).toISOString()
                });
                events = events.concat(response.result.items);
            }
        }
        if (!scheduledTasksCalendarId) {
            try {
                response = yield gapi.client.calendar.calendars.insert({
                    resource: {
                        summary: "Scheduled Tasks"
                    }
                });
            }
            catch (err) {
                if (err instanceof Error)
                    document.getElementById('content').innerText = err.message;
                return;
            }
            response = yield gapi.client.calendar.calendarList.list();
            calendars = response.result.items;
            calendars.forEach((calendar) => {
                if (calendar.summary == "Scheduled Tasks") {
                    scheduledTasksCalendarId = calendar.id;
                }
            });
        }
        else {
            response = yield gapi.client.calendar.events.list({
                'calendarId': scheduledTasksCalendarId
            });
            let scheduledEvents = response.result.items;
            for (let event of scheduledEvents) {
                yield gapi.client.calendar.events.delete({
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
                let durationScheduled = yield eventSchedule.findScheduling(todoTask, Math.min(30, timeLeftToSchedule), currentStartDate, currentEndDate);
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
    });
}


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = {};
/******/ 	__webpack_modules__["./src/index.ts"]();
/******/ 	
/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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Ly9nb29nbGUtY2FsZW5kYXItdG9kby1zY2hlZHVsZXIvLi9zcmMvaW5kZXgudHMiLCJ3ZWJwYWNrOi8vZ29vZ2xlLWNhbGVuZGFyLXRvZG8tc2NoZWR1bGVyL3dlYnBhY2svYmVmb3JlLXN0YXJ0dXAiLCJ3ZWJwYWNrOi8vZ29vZ2xlLWNhbGVuZGFyLXRvZG8tc2NoZWR1bGVyL3dlYnBhY2svc3RhcnR1cCIsIndlYnBhY2s6Ly9nb29nbGUtY2FsZW5kYXItdG9kby1zY2hlZHVsZXIvd2VicGFjay9hZnRlci1zdGFydHVwIl0sInNvdXJjZXNDb250ZW50IjpbImxldCB0b2RvVGFza3M6IFRvZG9UYXNrW10gPSBbXTtcbmxldCBzY2hlZHVsZWRUYXNrc0NhbGVuZGFySWQ6IHN0cmluZztcblxubGV0IHRva2VuQ2xpZW50OiBnb29nbGUuYWNjb3VudHMub2F1dGgyLlRva2VuQ2xpZW50O1xuY29uc3QgQVBJX0tFWSA9ICdBSXphU3lERVhIMTMtdDRpdUJTTlYyTFk0Zk11NUxoNDU4OGFqNVEnO1xuY29uc3QgQ0xJRU5UX0lEID0gJzYyNjM5NzA0NDg3LWhtdXBiYTB2Z2oxZWN0dWFxc28yb2E2cjQ2N3EzZ2g4LmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tJztcbmNvbnN0IERJU0NPVkVSWV9ET0NTID0gWydodHRwczovL3d3dy5nb29nbGVhcGlzLmNvbS9kaXNjb3ZlcnkvdjEvYXBpcy9jYWxlbmRhci92My9yZXN0JywgJ2h0dHBzOi8vd3d3Lmdvb2dsZWFwaXMuY29tL2Rpc2NvdmVyeS92MS9hcGlzL3Rhc2tzL3YxL3Jlc3QnXTtcbmNvbnN0IFNDT1BFUyA9ICdodHRwczovL3d3dy5nb29nbGVhcGlzLmNvbS9hdXRoL2NhbGVuZGFyIGh0dHBzOi8vd3d3Lmdvb2dsZWFwaXMuY29tL2F1dGgvdGFza3MucmVhZG9ubHknO1xuXG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgYXN5bmMgKCkgPT4ge1xuXHRkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYXV0aG9yaXplX2J1dHRvbicpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgYXV0aG9yaXplKTtcblx0ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3NjaGVkdWxlX3Rhc2tzX2J1dHRvbicpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgc2NoZWR1bGVUYXNrcyk7XG59KTtcblxuYXN5bmMgZnVuY3Rpb24gYXV0aG9yaXplKCkge1xuXHRnYXBpLmxvYWQoJ2NsaWVudCcsIGFzeW5jICgpID0+IHtcblx0XHRhd2FpdCBnYXBpLmNsaWVudC5pbml0KHtcblx0XHRcdGFwaUtleTogQVBJX0tFWSxcblx0XHRcdGRpc2NvdmVyeURvY3M6IERJU0NPVkVSWV9ET0NTLFxuXHRcdH0pXG5cdH1cblx0KTtcblxuXHR0b2tlbkNsaWVudCA9IGdvb2dsZS5hY2NvdW50cy5vYXV0aDIuaW5pdFRva2VuQ2xpZW50KHtcblx0XHRjbGllbnRfaWQ6IENMSUVOVF9JRCxcblx0XHRzY29wZTogU0NPUEVTLFxuXHRcdGNhbGxiYWNrOiBzaG93VGFza3Ncblx0fSk7XG5cdHRva2VuQ2xpZW50LnJlcXVlc3RBY2Nlc3NUb2tlbih7IHByb21wdDogJ2NvbnNlbnQnIH0pO1xufVxuXG5jbGFzcyBUb2RvVGFzayB7XG5cdHRhc2s6IGdhcGkuY2xpZW50LnRhc2tzLlRhc2s7XG5cdGR1cmF0aW9uOiBudW1iZXI7XG5cdGNvbnN0cnVjdG9yKHRhc2s6IGdhcGkuY2xpZW50LnRhc2tzLlRhc2spIHtcblx0XHR0aGlzLnRhc2sgPSB0YXNrO1xuXHRcdHRoaXMuZHVyYXRpb24gPSArdGFzay5ub3Rlcztcblx0fVxufVxuXG5hc3luYyBmdW5jdGlvbiBzaG93VGFza3MoKSB7XG5cdGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzY2hlZHVsZV90YXNrc19idXR0b24nKS5zdHlsZS52aXNpYmlsaXR5ID0gJ2hpZGRlbic7XG5cdGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzaWdub3V0X2J1dHRvbicpLnN0eWxlLnZpc2liaWxpdHkgPSAndmlzaWJsZSc7XG5cdGxldCByZXNwb25zZTtcblxuXHR0cnkge1xuXHRcdHJlc3BvbnNlID0gYXdhaXQgZ2FwaS5jbGllbnQudGFza3MudGFza2xpc3RzLmxpc3QoKTtcblx0fVxuXHRjYXRjaCAoZXJyKSB7XG5cdFx0aWYgKGVyciBpbnN0YW5jZW9mIEVycm9yKVxuXHRcdFx0ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NvbnRlbnQnKS5pbm5lclRleHQgPSBlcnIubWVzc2FnZTtcblx0XHRyZXR1cm47XG5cdH1cblxuXHRjb25zdCB0YXNrTGlzdHMgPSByZXNwb25zZS5yZXN1bHQuaXRlbXM7XG5cdGlmICh0YXNrTGlzdHMubGVuZ3RoID09PSAwKSB7XG5cdFx0ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NvbnRlbnQnKS5pbm5lclRleHQgPSAnTm8gdGFza3MgZm91bmQuJztcblx0XHRyZXR1cm47XG5cdH1cblx0bGV0IG15VGFza3NJZDtcblx0dGFza0xpc3RzLmZvckVhY2goKHRhc2spID0+IHtcblx0XHRpZiAodGFzay50aXRsZSA9PT0gJ015IFRhc2tzJykge1xuXHRcdFx0bXlUYXNrc0lkID0gdGFzay5pZDtcblx0XHR9XG5cdH0pO1xuXG5cdGlmICghbXlUYXNrc0lkKSB7XG5cdFx0ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NvbnRlbnQnKS5pbm5lclRleHQgPSAnTXkgVGFza3Mgbm90IGZvdW5kLic7XG5cdFx0cmV0dXJuO1xuXHR9XG5cblx0dHJ5IHtcblx0XHRyZXNwb25zZSA9IGF3YWl0IGdhcGkuY2xpZW50LnRhc2tzLnRhc2tzLmxpc3Qoe1xuXHRcdFx0dGFza2xpc3Q6IG15VGFza3NJZCxcblx0XHRcdHNob3dDb21wbGV0ZWQ6IGZhbHNlXG5cdFx0fSk7XG5cdFx0bGV0IHRhc2tzID0gcmVzcG9uc2UucmVzdWx0Lml0ZW1zO1xuXHRcdGlmICh0YXNrcy5sZW5ndGggPT09IDApIHtcblx0XHRcdGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjb250ZW50JykuaW5uZXJUZXh0ID0gJ05vIHRhc2tzIGZvdW5kLic7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHRcdGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjb250ZW50JykuaW5uZXJUZXh0ID0gJyc7XG5cdFx0dGFza3MuZm9yRWFjaCgodGFzaykgPT4ge1xuXHRcdFx0bGV0IHRvZG9UYXNrID0gbmV3IFRvZG9UYXNrKHRhc2spO1xuXHRcdFx0dG9kb1Rhc2tzLnB1c2godG9kb1Rhc2spO1xuXHRcdFx0ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NvbnRlbnQnKS5pbm5lclRleHQgKz0gdGFzay50aXRsZSArICdcXG4nO1xuXHRcdH0pO1xuXHR9IGNhdGNoIChlcnIpIHtcblx0XHRpZiAoZXJyIGluc3RhbmNlb2YgRXJyb3IpXG5cdFx0XHRkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY29udGVudCcpLmlubmVyVGV4dCA9IGVyci5tZXNzYWdlO1xuXHR9XG5cblx0ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3NjaGVkdWxlX3Rhc2tzX2J1dHRvbicpLnN0eWxlLnZpc2liaWxpdHkgPSAndmlzaWJsZSc7XG5cdGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdhdXRob3JpemVfYnV0dG9uJykuaW5uZXJUZXh0ID0gJ1JlZnJlc2gnO1xufVxuXG5jbGFzcyBUaW1lU2xvdCB7XG5cdHN0YXJ0O1xuXHRlbmQ7XG5cdGNvbnN0cnVjdG9yKHN0YXJ0OiBEYXRlLCBlbmQ6IERhdGUpIHtcblx0XHR0aGlzLnN0YXJ0ID0gc3RhcnQ7XG5cdFx0dGhpcy5lbmQgPSBlbmQ7XG5cdH1cblxuXHQvLyBHZXQgZHVyYXRpb24gaW4gbWludXRlc1xuXHRnZXREdXJhdGlvbigpIHtcblx0XHRsZXQgZHVyYXRpb24gPSB0aGlzLmVuZC5nZXRUaW1lKCkgLSB0aGlzLnN0YXJ0LmdldFRpbWUoKTtcblx0XHRyZXR1cm4gZHVyYXRpb24gLyA2MDAwMDtcblx0fVxufVxuXG5jbGFzcyBFdmVudFNjaGVkdWxlIHtcblx0ZXZlbnRzOiBnYXBpLmNsaWVudC5jYWxlbmRhci5FdmVudFtdO1xuXHRjb25zdHJ1Y3RvcihldmVudHM6IGdhcGkuY2xpZW50LmNhbGVuZGFyLkV2ZW50W10pIHtcblx0XHR0aGlzLmV2ZW50cyA9IGV2ZW50cztcblx0XHR0aGlzLmV2ZW50cy5zb3J0KChhLCBiKSA9PiB7XG5cdFx0XHRyZXR1cm4gbmV3IERhdGUoYS5lbmQuZGF0ZVRpbWUpID4gbmV3IERhdGUoYi5lbmQuZGF0ZVRpbWUpID8gMSA6IC0xO1xuXHRcdH0pO1xuXHR9XG5cblx0YXN5bmMgZmluZFNjaGVkdWxpbmcodG9kb1Rhc2s6IFRvZG9UYXNrLCBkdXJhdGlvbjogbnVtYmVyLCBzdGFydERhdGU6IERhdGUsIGVuZERhdGU6IERhdGUpIHtcblx0XHRsZXQgZHVyYXRpb25SZW1haW5pbmcgPSBkdXJhdGlvbjtcblx0XHRsZXQgYXZhaWxhYmxlVGltZVNsb3RzID0gdGhpcy5nZXRBdmFpbGFibGVUaW1lU2xvdHMoc3RhcnREYXRlLCBlbmREYXRlKTtcblx0XHRmb3IgKGxldCB0aW1lU2xvdCA9IDA7IHRpbWVTbG90IDwgYXZhaWxhYmxlVGltZVNsb3RzLmxlbmd0aCAmJiBkdXJhdGlvblJlbWFpbmluZyA+IDA7IHRpbWVTbG90KyspIHtcblx0XHRcdGlmIChhdmFpbGFibGVUaW1lU2xvdHNbdGltZVNsb3RdLmdldER1cmF0aW9uKCkgPj0gZHVyYXRpb25SZW1haW5pbmcpIHtcblx0XHRcdFx0bGV0IHNjaGVkdWxlZFRpbWVTbG90ID0gbmV3IFRpbWVTbG90KGF2YWlsYWJsZVRpbWVTbG90c1t0aW1lU2xvdF0uc3RhcnQsIG5ldyBEYXRlKGF2YWlsYWJsZVRpbWVTbG90c1t0aW1lU2xvdF0uc3RhcnQuZ2V0VGltZSgpICsgZHVyYXRpb25SZW1haW5pbmcgKiA2MDAwMCkpO1xuXHRcdFx0XHRhd2FpdCB0aGlzLnNjaGVkdWxlKHRvZG9UYXNrLCBzY2hlZHVsZWRUaW1lU2xvdCk7XG5cdFx0XHRcdGR1cmF0aW9uUmVtYWluaW5nID0gMDtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGF3YWl0IHRoaXMuc2NoZWR1bGUodG9kb1Rhc2ssIGF2YWlsYWJsZVRpbWVTbG90c1t0aW1lU2xvdF0pO1xuXHRcdFx0XHRkdXJhdGlvblJlbWFpbmluZyAtPSBhdmFpbGFibGVUaW1lU2xvdHNbdGltZVNsb3RdLmdldER1cmF0aW9uKCk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGR1cmF0aW9uIC0gZHVyYXRpb25SZW1haW5pbmc7XG5cdH1cblxuXHRhc3luYyBzY2hlZHVsZSh0b2RvVGFzazogVG9kb1Rhc2ssIHRpbWVTbG90OiBUaW1lU2xvdCkge1xuXHRcdGxldCBwcmV2aW91c0V2ZW50ID0gdGhpcy5nZXRQcmV2aW91c0V2ZW50KHRpbWVTbG90LnN0YXJ0KTtcblx0XHRpZiAocHJldmlvdXNFdmVudCAmJiBwcmV2aW91c0V2ZW50LnN1bW1hcnkgPT09IHRvZG9UYXNrLnRhc2sudGl0bGUpIHtcblx0XHRcdHRyeSB7XG5cdFx0XHRcdGF3YWl0IGdhcGkuY2xpZW50LmNhbGVuZGFyLmV2ZW50cy51cGRhdGUoe1xuXHRcdFx0XHRcdGNhbGVuZGFySWQ6IHNjaGVkdWxlZFRhc2tzQ2FsZW5kYXJJZCxcblx0XHRcdFx0XHRldmVudElkOiBwcmV2aW91c0V2ZW50LmlkLFxuXHRcdFx0XHRcdHJlc291cmNlOiB7XG5cdFx0XHRcdFx0XHRzdW1tYXJ5OiBwcmV2aW91c0V2ZW50LnN1bW1hcnksXG5cdFx0XHRcdFx0XHRkZXNjcmlwdGlvbjogcHJldmlvdXNFdmVudC5kZXNjcmlwdGlvbixcblx0XHRcdFx0XHRcdHN0YXJ0OiB7XG5cdFx0XHRcdFx0XHRcdGRhdGVUaW1lOiBwcmV2aW91c0V2ZW50LnN0YXJ0LmRhdGVUaW1lLFxuXHRcdFx0XHRcdFx0XHR0aW1lWm9uZTogJ0FtZXJpY2EvTG9zX0FuZ2VsZXMnXG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0ZW5kOiB7XG5cdFx0XHRcdFx0XHRcdGRhdGVUaW1lOiB0aW1lU2xvdC5lbmQudG9JU09TdHJpbmcoKSxcblx0XHRcdFx0XHRcdFx0dGltZVpvbmU6ICdBbWVyaWNhL0xvc19BbmdlbGVzJ1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSk7XG5cdFx0XHRcdHByZXZpb3VzRXZlbnQuZW5kLmRhdGVUaW1lID0gdGltZVNsb3QuZW5kLnRvSVNPU3RyaW5nKCk7XG5cdFx0XHR9IGNhdGNoIChlcnIpIHtcblx0XHRcdFx0aWYgKGVyciBpbnN0YW5jZW9mIEVycm9yKVxuXHRcdFx0XHRcdGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjb250ZW50JykuaW5uZXJUZXh0ID0gZXJyLm1lc3NhZ2U7XG5cdFx0XHR9XG5cdFx0fSBlbHNlIHtcblx0XHRcdGxldCBldmVudDogZ2FwaS5jbGllbnQuY2FsZW5kYXIuRXZlbnQgPSB7XG5cdFx0XHRcdHN1bW1hcnk6IHRvZG9UYXNrLnRhc2sudGl0bGUsXG5cdFx0XHRcdHN0YXJ0OiB7XG5cdFx0XHRcdFx0ZGF0ZVRpbWU6IHRpbWVTbG90LnN0YXJ0LnRvSVNPU3RyaW5nKCksXG5cdFx0XHRcdFx0dGltZVpvbmU6ICdBbWVyaWNhL0xvc19BbmdlbGVzJ1xuXHRcdFx0XHR9LFxuXHRcdFx0XHRlbmQ6IHtcblx0XHRcdFx0XHRkYXRlVGltZTogdGltZVNsb3QuZW5kLnRvSVNPU3RyaW5nKCksXG5cdFx0XHRcdFx0dGltZVpvbmU6ICdBbWVyaWNhL0xvc19BbmdlbGVzJ1xuXHRcdFx0XHR9XG5cdFx0XHR9O1xuXG5cblx0XHRcdC8vIFNhdmUgdG8gR29vZ2xlIENhbGVuZGFyXG5cdFx0XHR0cnkge1xuXHRcdFx0XHRsZXQgcmVzcG9uc2UgPSBhd2FpdCBnYXBpLmNsaWVudC5jYWxlbmRhci5ldmVudHMuaW5zZXJ0KHtcblx0XHRcdFx0XHRjYWxlbmRhcklkOiBzY2hlZHVsZWRUYXNrc0NhbGVuZGFySWQsXG5cdFx0XHRcdFx0cmVzb3VyY2U6IGV2ZW50XG5cdFx0XHRcdH0pO1xuXHRcdFx0XHRldmVudCA9IHJlc3BvbnNlLnJlc3VsdDtcblx0XHRcdFx0ZXZlbnQuc3RhcnQuZGF0ZVRpbWUgPSB0aW1lU2xvdC5zdGFydC50b0lTT1N0cmluZygpO1xuXHRcdFx0XHRldmVudC5lbmQuZGF0ZVRpbWUgPSB0aW1lU2xvdC5lbmQudG9JU09TdHJpbmcoKTtcblx0XHRcdFx0dGhpcy5ldmVudHMucHVzaChldmVudCk7XG5cdFx0XHRcdHRoaXMuZXZlbnRzLnNvcnQoKGEsIGIpID0+IHtcblx0XHRcdFx0XHRyZXR1cm4gbmV3IERhdGUoYS5lbmQuZGF0ZVRpbWUpID4gbmV3IERhdGUoYi5lbmQuZGF0ZVRpbWUpID8gMSA6IC0xO1xuXHRcdFx0XHR9KTtcblx0XHRcdH0gY2F0Y2ggKGVycikge1xuXHRcdFx0XHRpZiAoZXJyIGluc3RhbmNlb2YgRXJyb3IpXG5cdFx0XHRcdFx0ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NvbnRlbnQnKS5pbm5lclRleHQgPSBlcnIubWVzc2FnZTtcblx0XHRcdH1cblx0XHR9XG5cblx0fVxuXG5cdGdldFByZXZpb3VzRXZlbnQoc3RhcnREYXRlOiBEYXRlKSB7XG5cdFx0bGV0IHByZXZpb3VzRXZlbnQgPSB0aGlzLmV2ZW50cy5maW5kKChldmVudCkgPT4ge1xuXHRcdFx0bGV0IGVuZCA9IG5ldyBEYXRlKGV2ZW50LmVuZC5kYXRlVGltZSk7XG5cdFx0XHRyZXR1cm4gZW5kLmdldEZ1bGxZZWFyKCkgPT09IHN0YXJ0RGF0ZS5nZXRGdWxsWWVhcigpICYmXG5cdFx0XHRcdGVuZC5nZXRNb250aCgpID09PSBzdGFydERhdGUuZ2V0TW9udGgoKSAmJlxuXHRcdFx0XHRlbmQuZ2V0RGF0ZSgpID09PSBzdGFydERhdGUuZ2V0RGF0ZSgpICYmXG5cdFx0XHRcdGVuZC5nZXRIb3VycygpID09PSBzdGFydERhdGUuZ2V0SG91cnMoKSAmJlxuXHRcdFx0XHRlbmQuZ2V0TWludXRlcygpID09PSBzdGFydERhdGUuZ2V0TWludXRlcygpICYmXG5cdFx0XHRcdGVuZC5nZXRTZWNvbmRzKCkgPT09IHN0YXJ0RGF0ZS5nZXRTZWNvbmRzKCk7XG5cdFx0fSk7XG5cdFx0cmV0dXJuIHByZXZpb3VzRXZlbnQ7XG5cdH1cblxuXHRnZXRBdmFpbGFibGVUaW1lU2xvdHMoc3RhcnREYXRlOiBEYXRlLCBlbmREYXRlOiBEYXRlKSB7XG5cdFx0bGV0IHRpbWVTbG90cyA9IFtdO1xuXG5cdFx0bGV0IGV2ZW50c1dpdGhpblRpbWVmcmFtZTogZ2FwaS5jbGllbnQuY2FsZW5kYXIuRXZlbnRbXSA9IFtdO1xuXHRcdHRoaXMuZXZlbnRzLmZvckVhY2goKGV2ZW50KSA9PiB7XG5cdFx0XHRpZiAoKG5ldyBEYXRlKGV2ZW50LnN0YXJ0LmRhdGVUaW1lKSA+PSBzdGFydERhdGUgJiYgbmV3IERhdGUoZXZlbnQuc3RhcnQuZGF0ZVRpbWUpIDw9IGVuZERhdGUpXG5cdFx0XHRcdHx8IChuZXcgRGF0ZShldmVudC5lbmQuZGF0ZVRpbWUpID49IHN0YXJ0RGF0ZSAmJiBuZXcgRGF0ZShldmVudC5lbmQuZGF0ZVRpbWUpIDw9IGVuZERhdGUpKSB7XG5cdFx0XHRcdGV2ZW50c1dpdGhpblRpbWVmcmFtZS5wdXNoKGV2ZW50KTtcblx0XHRcdH0gZWxzZSBpZiAoZXZlbnQucmVjdXJyZW5jZSAmJiBldmVudC5yZWN1cnJlbmNlLmF0KDApID09ICdSUlVMRTpGUkVRPURBSUxZJykge1xuXHRcdFx0XHRsZXQgc3RhcnQgPSBuZXcgRGF0ZShldmVudC5zdGFydC5kYXRlVGltZSk7XG5cdFx0XHRcdHN0YXJ0LnNldFVUQ0Z1bGxZZWFyKHN0YXJ0RGF0ZS5nZXRVVENGdWxsWWVhcigpKTtcblx0XHRcdFx0c3RhcnQuc2V0VVRDTW9udGgoc3RhcnREYXRlLmdldFVUQ01vbnRoKCkpO1xuXHRcdFx0XHRzdGFydC5zZXRVVENEYXRlKHN0YXJ0RGF0ZS5nZXRVVENEYXRlKCkpO1xuXHRcdFx0XHRsZXQgZW5kID0gbmV3IERhdGUoZXZlbnQuZW5kLmRhdGVUaW1lKTtcblx0XHRcdFx0ZW5kLnNldFVUQ0Z1bGxZZWFyKHN0YXJ0RGF0ZS5nZXRVVENGdWxsWWVhcigpKTtcblx0XHRcdFx0ZW5kLnNldFVUQ01vbnRoKHN0YXJ0RGF0ZS5nZXRVVENNb250aCgpKTtcblx0XHRcdFx0ZW5kLnNldFVUQ0RhdGUoc3RhcnREYXRlLmdldFVUQ0RhdGUoKSk7XG5cdFx0XHRcdGlmIChzdGFydCA+IGVuZCkge1xuXHRcdFx0XHRcdGVuZC5zZXREYXRlKGVuZC5nZXREYXRlKCkgKyAxKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmICgoc3RhcnQgPj0gc3RhcnREYXRlICYmIHN0YXJ0IDw9IGVuZERhdGUpXG5cdFx0XHRcdFx0fHwgKGVuZCA+PSBzdGFydERhdGUgJiYgZW5kIDw9IGVuZERhdGUpKSB7XG5cdFx0XHRcdFx0bGV0IG5ld0V2ZW50ID0ge1xuXHRcdFx0XHRcdFx0c3VtbWFyeTogZXZlbnQuc3VtbWFyeSxcblx0XHRcdFx0XHRcdHN0YXJ0OiB7XG5cdFx0XHRcdFx0XHRcdGRhdGVUaW1lOiBzdGFydC50b0lTT1N0cmluZygpLFxuXHRcdFx0XHRcdFx0XHR0aW1lWm9uZTogJ0FtZXJpY2EvTG9zX0FuZ2VsZXMnXG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0ZW5kOiB7XG5cdFx0XHRcdFx0XHRcdGRhdGVUaW1lOiBlbmQudG9JU09TdHJpbmcoKSxcblx0XHRcdFx0XHRcdFx0dGltZVpvbmU6ICdBbWVyaWNhL0xvc19BbmdlbGVzJ1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRldmVudHNXaXRoaW5UaW1lZnJhbWUucHVzaChuZXdFdmVudCk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0c3RhcnQuc2V0RGF0ZShzdGFydC5nZXREYXRlKCkgKyAxKTtcblx0XHRcdFx0XHRlbmQuc2V0RGF0ZShlbmQuZ2V0RGF0ZSgpICsgMSk7XG5cdFx0XHRcdFx0aWYgKChzdGFydCA+PSBzdGFydERhdGUgJiYgc3RhcnQgPD0gZW5kRGF0ZSlcblx0XHRcdFx0XHRcdHx8IChlbmQgPj0gc3RhcnREYXRlICYmIGVuZCA8PSBlbmREYXRlKSkge1xuXHRcdFx0XHRcdFx0bGV0IG5ld0V2ZW50ID0ge1xuXHRcdFx0XHRcdFx0XHRzdW1tYXJ5OiBldmVudC5zdW1tYXJ5LFxuXHRcdFx0XHRcdFx0XHRzdGFydDoge1xuXHRcdFx0XHRcdFx0XHRcdGRhdGVUaW1lOiBzdGFydC50b0lTT1N0cmluZygpLFxuXHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHRlbmQ6IHtcblx0XHRcdFx0XHRcdFx0XHRkYXRlVGltZTogZW5kLnRvSVNPU3RyaW5nKCksXG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdGV2ZW50c1dpdGhpblRpbWVmcmFtZS5wdXNoKG5ld0V2ZW50KTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdGV2ZW50c1dpdGhpblRpbWVmcmFtZS5zb3J0KChhLCBiKSA9PiB7XG5cdFx0XHRyZXR1cm4gbmV3IERhdGUoYS5zdGFydC5kYXRlVGltZSkgPiBuZXcgRGF0ZShiLnN0YXJ0LmRhdGVUaW1lKSA/IDEgOiAtMTtcblx0XHR9KTtcblxuXHRcdC8vIElmIG5vIGV2ZW50cywgcmV0dXJuIDEgYWxsIGRheSB0aW1lIHNsb3Rcblx0XHRpZiAoZXZlbnRzV2l0aGluVGltZWZyYW1lLmxlbmd0aCA9PT0gMCkge1xuXHRcdFx0dGltZVNsb3RzLnB1c2gobmV3IFRpbWVTbG90KHN0YXJ0RGF0ZSwgZW5kRGF0ZSkpO1xuXHRcdFx0cmV0dXJuIHRpbWVTbG90cztcblx0XHR9XG5cdFx0Zm9yIChsZXQgZSA9IDA7IGUgPCBldmVudHNXaXRoaW5UaW1lZnJhbWUubGVuZ3RoOyBlKyspIHtcblx0XHRcdGlmIChlIDwgKGV2ZW50c1dpdGhpblRpbWVmcmFtZS5sZW5ndGggLSAxKSAmJiBuZXcgRGF0ZShldmVudHNXaXRoaW5UaW1lZnJhbWVbZV0uZW5kLmRhdGVUaW1lKSA8IG5ldyBEYXRlKGV2ZW50c1dpdGhpblRpbWVmcmFtZVtlICsgMV0uc3RhcnQuZGF0ZVRpbWUpKSB7XG5cdFx0XHRcdHRpbWVTbG90cy5wdXNoKG5ldyBUaW1lU2xvdChuZXcgRGF0ZShldmVudHNXaXRoaW5UaW1lZnJhbWVbZV0uZW5kLmRhdGVUaW1lKSwgbmV3IERhdGUoZXZlbnRzV2l0aGluVGltZWZyYW1lW2UgKyAxXS5zdGFydC5kYXRlVGltZSkpKTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKGUgPT0gMCAmJiBuZXcgRGF0ZShldmVudHNXaXRoaW5UaW1lZnJhbWVbZV0uc3RhcnQuZGF0ZVRpbWUpID4gc3RhcnREYXRlKSB7XG5cdFx0XHRcdHRpbWVTbG90cy5wdXNoKG5ldyBUaW1lU2xvdChzdGFydERhdGUsIG5ldyBEYXRlKGV2ZW50c1dpdGhpblRpbWVmcmFtZVtlXS5zdGFydC5kYXRlVGltZSkpKTtcblx0XHRcdH1cblx0XHRcdGlmIChuZXcgRGF0ZShldmVudHNXaXRoaW5UaW1lZnJhbWVbZV0uZW5kLmRhdGVUaW1lKSA+IGVuZERhdGUpIHtcblx0XHRcdFx0cmV0dXJuIHRpbWVTbG90cztcblx0XHRcdH1cblx0XHR9XG5cdFx0aWYgKG5ldyBEYXRlKGV2ZW50c1dpdGhpblRpbWVmcmFtZVtldmVudHNXaXRoaW5UaW1lZnJhbWUubGVuZ3RoIC0gMV0uZW5kLmRhdGVUaW1lKSA8IGVuZERhdGUpIHtcblx0XHRcdHRpbWVTbG90cy5wdXNoKG5ldyBUaW1lU2xvdChuZXcgRGF0ZShldmVudHNXaXRoaW5UaW1lZnJhbWVbZXZlbnRzV2l0aGluVGltZWZyYW1lLmxlbmd0aCAtIDFdLmVuZC5kYXRlVGltZSksIGVuZERhdGUpKTtcblx0XHR9XG5cdFx0cmV0dXJuIHRpbWVTbG90cztcblxuXHR9XG5cbn1cblxuYXN5bmMgZnVuY3Rpb24gc2NoZWR1bGVUYXNrcygpIHtcblx0Y29uc29sZS5sb2coJ1NjaGVkdWxpbmcgdGFza3MuLi4nKTtcblx0bGV0IHJlc3BvbnNlO1xuXHR0cnkge1xuXHRcdHJlc3BvbnNlID0gYXdhaXQgZ2FwaS5jbGllbnQuY2FsZW5kYXIuY2FsZW5kYXJMaXN0Lmxpc3QoKTtcblx0fSBjYXRjaCAoZXJyKSB7XG5cdFx0aWYgKGVyciBpbnN0YW5jZW9mIEVycm9yKVxuXHRcdFx0ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NvbnRlbnQnKS5pbm5lclRleHQgPSBlcnIubWVzc2FnZTtcblx0XHRyZXR1cm47XG5cdH1cblxuXHRsZXQgY2FsZW5kYXJzID0gcmVzcG9uc2UucmVzdWx0Lml0ZW1zO1xuXHRpZiAoIWNhbGVuZGFycyB8fCBjYWxlbmRhcnMubGVuZ3RoID09IDApIHtcblx0XHRkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY29udGVudCcpLmlubmVyVGV4dCA9ICdObyBldmVudHMgZm91bmQuJztcblx0XHRyZXR1cm47XG5cdH1cblx0bGV0IGV2ZW50czogZ2FwaS5jbGllbnQuY2FsZW5kYXIuRXZlbnRbXSA9IFtdO1xuXHRmb3IgKGNvbnN0IGNhbGVuZGFyIG9mIGNhbGVuZGFycykge1xuXHRcdGlmIChjYWxlbmRhci5zdW1tYXJ5ID09IFwiU2NoZWR1bGVkIFRhc2tzXCIpIHtcblx0XHRcdHNjaGVkdWxlZFRhc2tzQ2FsZW5kYXJJZCA9IGNhbGVuZGFyLmlkO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXNwb25zZSA9IGF3YWl0IGdhcGkuY2xpZW50LmNhbGVuZGFyLmV2ZW50cy5saXN0KHtcblx0XHRcdFx0J2NhbGVuZGFySWQnOiBjYWxlbmRhci5pZCxcblx0XHRcdFx0J3RpbWVNaW4nOiAobmV3IERhdGUoKSkudG9JU09TdHJpbmcoKVxuXHRcdFx0fSk7XG5cdFx0XHRldmVudHMgPSBldmVudHMuY29uY2F0KHJlc3BvbnNlLnJlc3VsdC5pdGVtcyk7XG5cdFx0fVxuXHR9XG5cblx0aWYgKCFzY2hlZHVsZWRUYXNrc0NhbGVuZGFySWQpIHtcblx0XHR0cnkge1xuXHRcdFx0cmVzcG9uc2UgPSBhd2FpdCBnYXBpLmNsaWVudC5jYWxlbmRhci5jYWxlbmRhcnMuaW5zZXJ0KHtcblx0XHRcdFx0cmVzb3VyY2U6IHtcblx0XHRcdFx0XHRzdW1tYXJ5OiBcIlNjaGVkdWxlZCBUYXNrc1wiXG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH0gY2F0Y2ggKGVycikge1xuXHRcdFx0aWYgKGVyciBpbnN0YW5jZW9mIEVycm9yKVxuXHRcdFx0XHRkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY29udGVudCcpLmlubmVyVGV4dCA9IGVyci5tZXNzYWdlO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblx0XHRyZXNwb25zZSA9IGF3YWl0IGdhcGkuY2xpZW50LmNhbGVuZGFyLmNhbGVuZGFyTGlzdC5saXN0KCk7XG5cdFx0Y2FsZW5kYXJzID0gcmVzcG9uc2UucmVzdWx0Lml0ZW1zO1xuXHRcdGNhbGVuZGFycy5mb3JFYWNoKChjYWxlbmRhcikgPT4ge1xuXHRcdFx0aWYgKGNhbGVuZGFyLnN1bW1hcnkgPT0gXCJTY2hlZHVsZWQgVGFza3NcIikge1xuXHRcdFx0XHRzY2hlZHVsZWRUYXNrc0NhbGVuZGFySWQgPSBjYWxlbmRhci5pZDtcblx0XHRcdH1cblx0XHR9KTtcblx0fSBlbHNlIHtcblx0XHRyZXNwb25zZSA9IGF3YWl0IGdhcGkuY2xpZW50LmNhbGVuZGFyLmV2ZW50cy5saXN0KHtcblx0XHRcdCdjYWxlbmRhcklkJzogc2NoZWR1bGVkVGFza3NDYWxlbmRhcklkXG5cdFx0fSk7XG5cdFx0bGV0IHNjaGVkdWxlZEV2ZW50cyA9IHJlc3BvbnNlLnJlc3VsdC5pdGVtcztcblx0XHRmb3IgKGxldCBldmVudCBvZiBzY2hlZHVsZWRFdmVudHMpIHtcblx0XHRcdGF3YWl0IGdhcGkuY2xpZW50LmNhbGVuZGFyLmV2ZW50cy5kZWxldGUoe1xuXHRcdFx0XHQnY2FsZW5kYXJJZCc6IHNjaGVkdWxlZFRhc2tzQ2FsZW5kYXJJZCxcblx0XHRcdFx0J2V2ZW50SWQnOiBldmVudC5pZFxuXHRcdFx0fSk7XG5cdFx0fVxuXHR9XG5cblx0bGV0IGV2ZW50U2NoZWR1bGUgPSBuZXcgRXZlbnRTY2hlZHVsZShldmVudHMpO1xuXHR0b2RvVGFza3Muc29ydCgoYSwgYikgPT4ge1xuXHRcdHJldHVybiBhLnRhc2suZHVlID4gYi50YXNrLmR1ZSA/IDEgOiAtMTtcblx0fSk7XG5cblx0Zm9yIChjb25zdCB0b2RvVGFzayBvZiB0b2RvVGFza3MpIHtcblx0XHRsZXQgY3VycmVudFN0YXJ0RGF0ZSA9IG5ldyBEYXRlKCk7XG5cdFx0bGV0IGN1cnJlbnRFbmREYXRlID0gbmV3IERhdGUoKTtcblx0XHRjdXJyZW50RW5kRGF0ZS5zZXREYXRlKGN1cnJlbnRFbmREYXRlLmdldERhdGUoKSArIDEpO1xuXHRcdGN1cnJlbnRFbmREYXRlLnNldEhvdXJzKDAsIDAsIDAsIDApO1xuXHRcdGxldCB0aW1lTGVmdFRvU2NoZWR1bGUgPSB0b2RvVGFzay5kdXJhdGlvbjtcblx0XHR3aGlsZSAodGltZUxlZnRUb1NjaGVkdWxlID4gMCkge1xuXHRcdFx0bGV0IGR1cmF0aW9uU2NoZWR1bGVkID0gYXdhaXQgZXZlbnRTY2hlZHVsZS5maW5kU2NoZWR1bGluZyh0b2RvVGFzaywgTWF0aC5taW4oMzAsIHRpbWVMZWZ0VG9TY2hlZHVsZSksIGN1cnJlbnRTdGFydERhdGUsIGN1cnJlbnRFbmREYXRlKTtcblx0XHRcdHRpbWVMZWZ0VG9TY2hlZHVsZSAtPSBkdXJhdGlvblNjaGVkdWxlZDtcblx0XHRcdGN1cnJlbnRTdGFydERhdGUuc2V0RGF0ZShjdXJyZW50U3RhcnREYXRlLmdldERhdGUoKSArIDEpO1xuXHRcdFx0Y3VycmVudFN0YXJ0RGF0ZS5zZXRIb3VycygwLCAwLCAwLCAwKTtcblx0XHRcdGN1cnJlbnRFbmREYXRlLnNldERhdGUoY3VycmVudEVuZERhdGUuZ2V0RGF0ZSgpICsgMSk7XG5cdFx0XHRpZiAoY3VycmVudFN0YXJ0RGF0ZSA+IG5ldyBEYXRlKHRvZG9UYXNrLnRhc2suZHVlKSkge1xuXHRcdFx0XHRjdXJyZW50U3RhcnREYXRlID0gbmV3IERhdGUoKTtcblx0XHRcdFx0Y3VycmVudEVuZERhdGUgPSBuZXcgRGF0ZSgpO1xuXHRcdFx0XHRjdXJyZW50RW5kRGF0ZS5zZXREYXRlKGN1cnJlbnRFbmREYXRlLmdldERhdGUoKSArIDEpO1xuXHRcdFx0XHRjdXJyZW50RW5kRGF0ZS5zZXRIb3VycygwLCAwLCAwLCAwKTtcblx0XHRcdH1cblx0XHRcdGlmIChjdXJyZW50RW5kRGF0ZSA+IG5ldyBEYXRlKHRvZG9UYXNrLnRhc2suZHVlKSkge1xuXHRcdFx0XHRjdXJyZW50RW5kRGF0ZSA9IG5ldyBEYXRlKHRvZG9UYXNrLnRhc2suZHVlKTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxufSIsIiIsIi8vIHN0YXJ0dXBcbi8vIExvYWQgZW50cnkgbW9kdWxlIGFuZCByZXR1cm4gZXhwb3J0c1xuLy8gVGhpcyBlbnRyeSBtb2R1bGUgaXMgcmVmZXJlbmNlZCBieSBvdGhlciBtb2R1bGVzIHNvIGl0IGNhbid0IGJlIGlubGluZWRcbnZhciBfX3dlYnBhY2tfZXhwb3J0c19fID0ge307XG5fX3dlYnBhY2tfbW9kdWxlc19fW1wiLi9zcmMvaW5kZXgudHNcIl0oKTtcbiIsIiJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==