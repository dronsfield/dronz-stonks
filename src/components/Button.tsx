import { normalizeButton, normalizeInput } from "@/lib/mixins";
import React from "react";
import { styled } from "styled-components";

const StyledButton = styled.button`
  ${normalizeButton};
  background-color: black;
  color: white;
  font-weight: bold;
  padding: 0.75em;
  border-radius: 5px;
  width: 100%;
`;

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = (props) => {
  const { children, type } = props;
  return <StyledButton type={type}>{children}</StyledButton>;
};

export default Button;
