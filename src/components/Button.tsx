import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'default' | 'positive' | 'negative' | 'link';
export type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'size'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children?: ReactNode;
}

/**
 * Shim for `QubeDesignSystem_169a27.Button`, the one design-system component
 * mounted via `<x-import>` in the source `.dc.html`. Styled directly against
 * the real `pf-button*` classes shipped in `components/prefab/prefab.css`
 * rather than reimplementing the visual design.
 */
export function Button({ variant = 'primary', size = 'medium', className, disabled, children, ...rest }: ButtonProps) {
  const classes = [
    'pf-button',
    `pf-button--${variant}`,
    `pf-button--${size}`,
    disabled ? 'pf-button--disabled' : '',
    className || ''
  ].filter(Boolean).join(' ');
  return (
    <button className={classes} disabled={disabled} {...rest}>
      {children}
    </button>
  );
}
