import "./globals.css";

export const metadata = {
  title: "Maneri Premier League — Player Registration",
  description: "Register to play in the Maneri Premier League (MPL).",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
