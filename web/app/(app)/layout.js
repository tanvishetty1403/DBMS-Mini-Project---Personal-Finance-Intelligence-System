import Nav from '@/components/Nav';
export default function AppLayout({ children }) {
  return <><Nav /><main>{children}</main></>;
}
