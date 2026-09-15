import { Routes, Route } from "react-router-dom";

function Landing() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <h1 className="text-4xl font-bold">
        Meridian
      </h1>
    </div>
  );
}

function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <h1 className="text-4xl font-bold">
        Login
      </h1>
    </div>
  );
}

function Signup() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <h1 className="text-4xl font-bold">
        Signup
      </h1>
    </div>
  );
}

function Research() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <h1 className="text-4xl font-bold">
        Research Dashboard
      </h1>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/research" element={<Research />} />
    </Routes>
  );
}

export default App;
