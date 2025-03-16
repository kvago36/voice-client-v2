import { FormEvent } from "react";

interface LoginFormProps {
  onSubmit: (name: string) => void
}

export default function LoginForm({ onSubmit }: LoginFormProps) {
    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
  
      const formData = new FormData(e.currentTarget);
      const name = formData.get("name");

      if (name) {
        onSubmit(name as string);
      }
    }
  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md mx-auto my-10 p-6 bg-white shadow-md rounded-lg"
    >
      <div className="mb-4">
        <label
          htmlFor="name"
          className="block text-gray-700 text-sm font-bold mb-2"
        >
          Введите ваше имя:
        </label>
        <input
          type="text"
          id="name"
          name="name"
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          placeholder="Ваше имя"
          required
        />
      </div>
      <button
        type="submit"
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
      >
        Отправить
      </button>
    </form>
  );
}
