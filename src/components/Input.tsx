import { normalizeInput } from "@/lib/mixins";
import React from "react";
import { styled } from "styled-components";

const FormGroup = styled.label`
  display: block;
  margin-bottom: 1em;

  &:last-child {
    margin-bottom: 0;
  }
`;

const Label = styled.div`
  font-weight: bold;
  font-size: 0.8em;
  margin-bottom: 0.2em;
`;

const StyledInput = styled.input`
  ${normalizeInput};
  width: 100%;
  border: 2px solid #ccc;
  border-radius: 5px;
  padding: 0.5em;
`;

interface InputProps {
  label: string;
  id: string;
  defaultValue?: string;
}

const Input: React.FC<InputProps> = (props) => {
  const { label, id, defaultValue } = props;
  return (
    <FormGroup htmlFor={id}>
      <Label>{label}</Label>
      <StyledInput
        name={id}
        type="text"
        defaultValue={defaultValue}
      ></StyledInput>
    </FormGroup>
  );
};

export default Input;
