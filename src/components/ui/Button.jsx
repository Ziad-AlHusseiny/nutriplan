import { Link } from 'react-router-dom';
import { buttonClass } from './buttonClass.js';

/** Shared button; renders a router <Link> when `to` is given (TECHNICAL-PLAN §3). */
export default function Button({ variant = 'primary', size = 'md', to, className = '', children, type = 'button', ...props }) {
  const cls = buttonClass({ variant, size, className });
  if (to) {
    return (
      <Link to={to} className={cls} {...props}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} className={cls} {...props}>
      {children}
    </button>
  );
}
