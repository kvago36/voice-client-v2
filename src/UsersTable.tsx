import { User } from './types'

export default function UsersTable({ users }: { users: User[] }) {
  return (
      <div className="bg-white shadow-md rounded-lg overflow-hidden w-full max-w-4xl">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Id
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Registered date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Text's count
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((item, index) => (
              <tr key={index}>
                <td className="px-6 py-4 whitespace-nowrap text-left text-sm text-gray-900">
                  {item.user_id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-left text-sm text-gray-500">
                  {item.username}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-left text-sm text-gray-500">
                  {item.created_at}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-left text-sm text-gray-500">
                  {item.texts_count}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
  );
}
