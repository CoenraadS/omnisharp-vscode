/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { should } from 'chai';
import { tokenize, Input, Token } from './utils/tokenize';

describe("Grammar", () => {
    before(() => should());

    describe("Literals - string", () => {
        it("simple", () => {

            const input = Input.InClass(`string test = "hello world!";`);
            const tokens = tokenize(input);

            tokens.should.deep.equal([
                Token.PrimitiveType.String,
                Token.Identifiers.FieldName("test"),
                Token.Operators.Assignment,
                Token.Punctuation.String.Begin,
                Token.Literals.String("hello world!"),
                Token.Punctuation.String.End,
                Token.Punctuation.Semicolon]);
        });

        it("escaped double-quote", () => {

            const input = Input.InClass(`string test = "hello \\"world!\\"";`);
            const tokens = tokenize(input);

            tokens.should.deep.equal([
                Token.PrimitiveType.String,
                Token.Identifiers.FieldName("test"),
                Token.Operators.Assignment,
                Token.Punctuation.String.Begin,
                Token.Literals.String("hello "),
                Token.Literals.CharacterEscape("\\\""),
                Token.Literals.String("world!"),
                Token.Literals.CharacterEscape("\\\""),
                Token.Punctuation.String.End,
                Token.Punctuation.Semicolon]);
        });

        it("line break before close quote", () => {

            const input = Input.InClass(`
string test = "hello 
world!";`);
            const tokens = tokenize(input);

            tokens.should.deep.equal([
                Token.PrimitiveType.String,
                Token.Identifiers.FieldName("test"),
                Token.Operators.Assignment,
                Token.Punctuation.String.Begin,
                Token.Literals.String("hello"),

                // Note: Because the string ended prematurely, the rest of this line and the contents of the next are junk.
                Token.IllegalNewLine(" "),
                Token.Variables.ReadWrite("world"),
                Token.Operators.Logical.Not,
                Token.Punctuation.String.Begin,
                Token.IllegalNewLine(";")]);
        });

        it("simple (verbatim)", () => {

            const input = Input.InClass(`string test = @"hello world!";`);
            const tokens = tokenize(input);

            tokens.should.deep.equal([
                Token.PrimitiveType.String,
                Token.Identifiers.FieldName("test"),
                Token.Operators.Assignment,
                Token.Punctuation.String.VerbatimBegin,
                Token.Literals.String("hello world!"),
                Token.Punctuation.String.End,
                Token.Punctuation.Semicolon]);
        });

        it("escaped double-quote (verbatim)", () => {

            const input = Input.InClass("string test = @\"hello \"\"world!\"\"\";");
            const tokens = tokenize(input);

            tokens.should.deep.equal([
                Token.PrimitiveType.String,
                Token.Identifiers.FieldName("test"),
                Token.Operators.Assignment,
                Token.Punctuation.String.VerbatimBegin,
                Token.Literals.String("hello "),
                Token.Literals.CharacterEscape("\"\""),
                Token.Literals.String("world!"),
                Token.Literals.CharacterEscape("\"\""),
                Token.Punctuation.String.End,
                Token.Punctuation.Semicolon]);
        });

        it("line break before close quote (verbatim)", () => {

            const input = Input.InClass(`
string test = @"hello 
world!";`);
            const tokens = tokenize(input);

            tokens.should.deep.equal([
                Token.PrimitiveType.String,
                Token.Identifiers.FieldName("test"),
                Token.Operators.Assignment,
                Token.Punctuation.String.VerbatimBegin,
                Token.Literals.String("hello "),
                Token.Literals.String("world!"),
                Token.Punctuation.String.End,
                Token.Punctuation.Semicolon]);
        });

        it("highlight escaped double-quote properly (issue #1078 - repro 1)", () => {

            const input = Input.InMethod(`
configContent = rgx.Replace(configContent, $"name{suffix}\\"");
File.WriteAllText(_testConfigFile, configContent);
`);
            const tokens = tokenize(input);

            tokens.should.deep.equal([
                Token.Variables.ReadWrite("configContent"),
                Token.Operators.Assignment,
                Token.Variables.Object('rgx'),
                Token.Punctuation.Accessor,
                Token.Identifiers.MethodName("Replace"),
                Token.Punctuation.OpenParen,
                Token.Variables.ReadWrite("configContent"),
                Token.Punctuation.Comma,
                Token.Punctuation.InterpolatedString.Begin,
                Token.Literals.String("name"),
                Token.Punctuation.Interpolation.Begin,
                Token.Variables.ReadWrite("suffix"),
                Token.Punctuation.Interpolation.End,
                Token.Literals.CharacterEscape("\\\""),
                Token.Punctuation.String.End,
                Token.Punctuation.CloseParen,
                Token.Punctuation.Semicolon,
                Token.Variables.Object("File"),
                Token.Punctuation.Accessor,
                Token.Identifiers.MethodName("WriteAllText"),
                Token.Punctuation.OpenParen,
                Token.Variables.ReadWrite("_testConfigFile"),
                Token.Punctuation.Comma,
                Token.Variables.ReadWrite("configContent"),
                Token.Punctuation.CloseParen,
                Token.Punctuation.Semicolon
            ]);
        });

        it("highlight escaped double-quote properly (issue #1078 - repro 2)", () => {

            const input = Input.InMethod(`
throw new InvalidCastException(
    $"The value \\"{this.Value} is of the type \\"{this.Type}\\". You asked for \\"{typeof(T)}\\".");
`);
            const tokens = tokenize(input);

            tokens.should.deep.equal([
                Token.Keywords.Throw,
                Token.Keywords.New,
                Token.Type("InvalidCastException"),
                Token.Punctuation.OpenParen,
                Token.Punctuation.InterpolatedString.Begin,
                Token.Literals.String("The value "),
                Token.Literals.CharacterEscape("\\\""),
                Token.Punctuation.Interpolation.Begin,
                Token.Keywords.This,
                Token.Punctuation.Accessor,
                Token.Variables.Property("Value"),
                Token.Punctuation.Interpolation.End,
                Token.Literals.String(" is of the type "),
                Token.Literals.CharacterEscape("\\\""),
                Token.Punctuation.Interpolation.Begin,
                Token.Keywords.This,
                Token.Punctuation.Accessor,
                Token.Variables.Property("Type"),
                Token.Punctuation.Interpolation.End,
                Token.Literals.CharacterEscape("\\\""),
                Token.Literals.String(". You asked for "),
                Token.Literals.CharacterEscape("\\\""),
                Token.Punctuation.Interpolation.Begin,
                Token.Keywords.TypeOf,
                Token.Punctuation.OpenParen,
                Token.Type("T"),
                Token.Punctuation.CloseParen,
                Token.Punctuation.Interpolation.End,
                Token.Literals.CharacterEscape("\\\""),
                Token.Literals.String("."),
                Token.Punctuation.InterpolatedString.End,
                Token.Punctuation.CloseParen,
                Token.Punctuation.Semicolon
            ]);
        });

        it("highlight strings containing braces correctly (issue #746)", () => {

            const input = `
namespace X
{
    class Y
    {
        public MethodZ()
        {
            this.Writer.WriteLine("class CInput{0}Register : public {1}", index, baseClass);
        }
    }
}
`;
            const tokens = tokenize(input);

            tokens.should.deep.equal([
                Token.Keywords.Namespace,
                Token.Identifiers.NamespaceName("X"),
                Token.Punctuation.OpenBrace,
                Token.Keywords.Class,
                Token.Identifiers.ClassName("Y"),
                Token.Punctuation.OpenBrace,
                Token.Keywords.Modifiers.Public,
                Token.Identifiers.MethodName("MethodZ"),
                Token.Punctuation.OpenParen,
                Token.Punctuation.CloseParen,
                Token.Punctuation.OpenBrace,
                Token.Keywords.This,
                Token.Punctuation.Accessor,
                Token.Variables.Property("Writer"),
                Token.Punctuation.Accessor,
                Token.Identifiers.MethodName("WriteLine"),
                Token.Punctuation.OpenParen,
                Token.Punctuation.String.Begin,
                Token.Literals.String("class CInput{0}Register : public {1}"),
                Token.Punctuation.String.End,
                Token.Punctuation.Comma,
                Token.Variables.ReadWrite("index"),
                Token.Punctuation.Comma,
                Token.Variables.ReadWrite("baseClass"),
                Token.Punctuation.CloseParen,
                Token.Punctuation.Semicolon,
                Token.Punctuation.CloseBrace,
                Token.Punctuation.CloseBrace,
                Token.Punctuation.CloseBrace
            ]);
        });
    });
});