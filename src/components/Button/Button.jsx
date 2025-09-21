// src/components/Button/Button.jsx
import './Button.css'; // Ensure this path is correct

const Button = ({ children, onClick, variant = 'primary', type = 'button' }) => {
  return (
    <button
      type={type}
      className={`btn btn-${variant}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export default Button;