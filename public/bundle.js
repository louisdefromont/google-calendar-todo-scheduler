/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/index.ts":
/*!**********************!*\
  !*** ./src/index.ts ***!
  \**********************/
/***/ (function() {

eval("\nvar __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {\n    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }\n    return new (P || (P = Promise))(function (resolve, reject) {\n        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }\n        function rejected(value) { try { step(generator[\"throw\"](value)); } catch (e) { reject(e); } }\n        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }\n        step((generator = generator.apply(thisArg, _arguments || [])).next());\n    });\n};\nlet tokenClient;\nlet accessToken;\nconst CLIENT_ID = '62639704487-hmupba0vgj1ectuaqso2oa6r467q3gh8.apps.googleusercontent.com';\nconst SCOPES = 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/tasks.readonly';\ndocument.addEventListener('DOMContentLoaded', () => __awaiter(void 0, void 0, void 0, function* () {\n    const button = document.getElementById('authorize-button');\n    button.addEventListener('click', authorize);\n}));\nfunction authorize() {\n    return __awaiter(this, void 0, void 0, function* () {\n        tokenClient = google.accounts.oauth2.initTokenClient({\n            client_id: CLIENT_ID,\n            scope: SCOPES,\n            callback: (tokenResponse) => {\n                accessToken = tokenResponse.access_token;\n            }\n        });\n        tokenClient.requestAccessToken({ prompt: 'consent' });\n    });\n}\n\n\n//# sourceURL=webpack://google-calendar-todo-scheduler/./src/index.ts?");

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