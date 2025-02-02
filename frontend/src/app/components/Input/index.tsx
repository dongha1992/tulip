import {
  Children,
  cloneElement,
  ForwardedRef,
  forwardRef,
  ForwardRefRenderFunction,
  HTMLAttributes,
  InputHTMLAttributes,
  PropsWithoutRef,
  ReactElement,
  ReactNode,
} from 'react';
import useId from '@/app/hooks/useId';

interface InputProps extends HTMLAttributes<HTMLDivElement> {
  label?: ReactNode;
  children: ReactElement;
  bottomText?: string;
}

export function Input({ label, children, bottomText, ...props }: InputProps) {
  const child = Children.only(children);
  const generatedId = useId('input');
  const id = child.props.id ?? generatedId;
  const isError: boolean = child.props.error ?? false;

  return (
    <div style={{ width: '100%' }} {...props}>
      <label htmlFor={id} className="input_container__label">
        {label}
      </label>
      {cloneElement(child, {
        id,
        ...child.props,
      } as React.HTMLAttributes<HTMLElement>)}
      {bottomText !== null ? (
        <p className="input_container__bottom-text">{bottomText}</p>
      ) : null}
    </div>
  );
}

interface TextFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  error?: boolean;
}

const TextField = ({ error, ref, ...restProps }: TextFieldProps) => {
  return (
    <input
      className={`input_field ${error ? 'input_field--error' : ''}`}
      ref={ref}
      {...restProps}
    />
  );
};

Input.TextField = TextField;

interface SearchDropdownProps {
  isOpen: boolean;
  searchResults: SearchResult[];
}
