import { ReactElement } from 'react'

interface LayoutProps {
  children: ReactElement;
  title: string;
}

export default function Layout({ title, children }: LayoutProps) {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] relative items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <div className="p-4 text-center">
          <h1 className="text-xl font-bold">{title}</h1>
          {children}
        </div>
      </main>
    </div>
  );
}
