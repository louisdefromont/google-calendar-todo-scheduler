let tokenClient: google.accounts.oauth2.TokenClient;
let accessToken;
const CLIENT_ID = '62639704487-hmupba0vgj1ectuaqso2oa6r467q3gh8.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/tasks.readonly';

document.addEventListener('DOMContentLoaded', async () => {
	const button = document.getElementById('authorize-button');
	button.addEventListener('click', authorize);
});

async function authorize() {
	tokenClient = google.accounts.oauth2.initTokenClient({
		client_id: CLIENT_ID,
		scope: SCOPES,
		callback: (tokenResponse) => {
			accessToken = tokenResponse.access_token;
		}
	});
	tokenClient.requestAccessToken({ prompt: 'consent' });
}