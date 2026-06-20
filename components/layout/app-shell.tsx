import { Sidebar } from './sidebar';
export function AppShell({children}:{children:React.ReactNode}){return <div className="flex"><Sidebar/><main className="min-h-screen flex-1 p-8">{children}</main></div>}
