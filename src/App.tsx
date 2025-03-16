import { useState, useEffect } from "react";

import { HOST } from "./constants";

import Texts from "./TextsTable";
import Users from "./UsersTable";
import LoginForm from "./LoginForm";
import VoiceRecorder from "./VoiceRecorder";

import { User, Text } from "./types";

import Layout from "./Layout";

function App() {
  const [name, setName] = useState("");
  const [userId, setUserId] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [texts, setTexts] = useState<Text[]>([]);
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    fetch(`${HOST}/api/users/`)
      .then((res) => res.json())
      .then((data) => setUsers(data.users))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (userId) {
      fetch(`${HOST}/api/users/${userId}`)
        .then((res) => res.json())
        .then((data) => setTexts(data.texts))
        .catch(console.error);
    }
  }, [userId]);

  const logout = () => {
    setName("");
    setErrorText("");
  };

  const login = async (name: string) => {
    try {
      const response = await fetch(`${HOST}/api/users/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username: name }),
      });

      const user = await response.json();

      if (user) {
        setUserId(user.user_id);
        setName(name as string);
      }
    } catch {
      setErrorText("Error, server unavalible");
    }
  };

  const saveMessage = async (message: string) => {
    try {
      const response = await fetch(`${HOST}/api/users/${userId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: message }),
      });

      const json = await response.json();

      setTexts(json.texts);
    } catch (error) {
      console.error(error);
    }
  };

  if (!name) {
    return (
      <Layout title="Распознавание голоса 🎤">
        <>
          <p className="text-red-500 p-2">{errorText}</p>
          <LoginForm onSubmit={login} />
          <Users users={users} />
        </>
      </Layout>
    );
  }

  return (
    <Layout title={`Добро пожаловать, ${name}! 🎤`}>
      <>
        <VoiceRecorder onSave={saveMessage} />
        <Texts texts={texts} />
        <button
          type="button"
          onClick={logout}
          className="fixed top-0 right-0 p-2 cursor-pointer text-gray-500 hover:text-gray-700 focus:outline-none"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </>
    </Layout>
  );
}

export default App;
