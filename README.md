# Speech Processing App

## Description

The application records the user's speech, transcodes audio files into the **Linear16** format, and sends them to the backend via **WebSockets**. The processing result can be saved.

- Authentication by username (no password required). If a user with the specified name does not exist, it will be created automatically.

## Usage

1. Start the application.
2. Log in by entering a username.
3. Record a voice message.
4. Wait for processing and then stop the recording.
5. Save the result.

## Stack

- React
- Vite
- TypeScript
- WebSockets

