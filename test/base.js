'use strict';

const Code = require('@hapi/code');
const Joi = require('..');
const Lab = require('@hapi/lab');

const Helper = require('./helper');


const internals = {};


const { describe, it } = exports.lab = Lab.script();
const { expect } = Code;


describe('any', () => {

    it('should throw an exception if arguments were passed.', () => {

        expect(() => Joi.any('invalid argument.')).to.throw('The any type does not allow arguments');
    });

    describe('allow()', () => {

        it('allows valid values to be set', () => {

            expect(() => Joi.any().allow(true, 1, 'hello', new Date())).not.to.throw();
        });

        it('throws when passed undefined', () => {

            expect(() => Joi.any().allow(undefined)).to.throw('Cannot call allow/valid/invalid with undefined');
        });

        it('throws when override is not first item', () => {

            expect(() => Joi.any().allow(1, Joi.override)).to.throw('Override must be the first value');
        });

        it('overrides previous values', () => {

            const schema = Joi.object().allow(1).allow(Joi.override, 2);
            expect(schema.validate(1).error).to.be.an.error('"value" must be of type object');
            expect(schema.validate(2).error).to.not.exist();
        });

        it('clears previous values', () => {

            const schema = Joi.object().allow(1).allow(Joi.override);
            expect(schema.validate(1).error).to.be.an.error('"value" must be of type object');
            expect(schema.validate(2).error).to.be.an.error('"value" must be of type object');
            expect(schema.validate({}).error).to.not.exist();
        });

        it('ignores empty override', () => {

            const schema = Joi.allow(Joi.override);
            expect(schema._valids).to.be.null();
        });
    });

    describe('alter()', () => {

        it('errors on invalid argument', () => {

            expect(() => Joi.number().alter()).to.throw('Invalid targets argument');
            expect(() => Joi.number().alter('x')).to.throw('Invalid targets argument');
            expect(() => Joi.number().alter([])).to.throw('Invalid targets argument');

            expect(() => Joi.number().alter({ xx: 'x' })).to.throw('Alteration adjuster for xx must be a function');
        });
    });

    describe('cast()', () => {

        it('cancels cast', () => {

            const schema = Joi.number().cast('string').cast(false);
            expect(schema.validate('123')).to.equal({ value: 123 });
        });
    });

    describe('concat()', () => {

        it('throws when schema is not any', () => {

            expect(() => Joi.string().concat(Joi.number())).to.throw('Cannot merge type string with another type: number');
        });

        it('throws when schema is missing', () => {

            expect(() => Joi.string().concat()).to.throw('Invalid schema object');
        });

        it('throws when schema is invalid', () => {

            expect(() => Joi.string().concat(1)).to.throw('Invalid schema object');
        });

        it('merges two schemas (settings)', () => {

            const a = Joi.number().prefs({ convert: true });
            const b = Joi.prefs({ convert: false });

            Helper.validate(a, [
                [1, true],
                ['1', true]
            ]);

            Helper.validate(a.concat(b), [
                [1, true],
                ['1', false, null, {
                    message: '"value" must be a number',
                    details: [{
                        message: '"value" must be a number',
                        path: [],
                        type: 'number.base',
                        context: { label: 'value', value: '1' }
                    }]
                }]
            ]);
        });

        it('merges two schemas (valid)', () => {

            const a = Joi.string().valid('a');
            const b = Joi.string().valid('b');

            Helper.validate(a, [
                ['a', true],
                ['b', false, null, {
                    message: '"value" must be one of [a]',
                    details: [{
                        message: '"value" must be one of [a]',
                        path: [],
                        type: 'any.only',
                        context: { value: 'b', valids: ['a'], label: 'value' }
                    }]
                }]
            ]);

            Helper.validate(b, [
                ['b', true],
                ['a', false, null, {
                    message: '"value" must be one of [b]',
                    details: [{
                        message: '"value" must be one of [b]',
                        path: [],
                        type: 'any.only',
                        context: { value: 'a', valids: ['b'], label: 'value' }
                    }]
                }]
            ]);

            Helper.validate(a.concat(b), [
                ['a', true],
                ['b', true]
            ]);
        });

        it('merges two schemas (invalid)', () => {

            const a = Joi.string().invalid('a');
            const b = Joi.invalid('b');

            Helper.validate(a, [
                ['b', true],
                ['a', false, null, {
                    message: '"value" contains an invalid value',
                    details: [{
                        message: '"value" contains an invalid value',
                        path: [],
                        type: 'any.invalid',
                        context: { value: 'a', invalids: ['a'], label: 'value' }
                    }]
                }]
            ]);

            Helper.validate(b, [
                ['a', true],
                ['b', false, null, {
                    message: '"value" contains an invalid value',
                    details: [{
                        message: '"value" contains an invalid value',
                        path: [],
                        type: 'any.invalid',
                        context: { value: 'b', invalids: ['b'], label: 'value' }
                    }]
                }]
            ]);

            Helper.validate(a.concat(b), [
                ['a', false, null, {
                    message: '"value" contains an invalid value',
                    details: [{
                        message: '"value" contains an invalid value',
                        path: [],
                        type: 'any.invalid',
                        context: { value: 'a', invalids: ['a', 'b'], label: 'value' }
                    }]
                }],
                ['b', false, null, {
                    message: '"value" contains an invalid value',
                    details: [{
                        message: '"value" contains an invalid value',
                        path: [],
                        type: 'any.invalid',
                        context: { value: 'b', invalids: ['a', 'b'], label: 'value' }
                    }]
                }]
            ]);
        });

        it('merges two schemas (valid/invalid)', () => {

            const a = Joi.string().valid('a').invalid('b');
            const b = Joi.string().valid('b').invalid('a');

            Helper.validate(a, [
                ['a', true],
                ['b', false, null, {
                    message: '"value" must be one of [a]',
                    details: [{
                        message: '"value" must be one of [a]',
                        path: [],
                        type: 'any.only',
                        context: { value: 'b', valids: ['a'], label: 'value' }
                    }]
                }]
            ]);

            Helper.validate(b, [
                ['b', true],
                ['a', false, null, {
                    message: '"value" must be one of [b]',
                    details: [{
                        message: '"value" must be one of [b]',
                        path: [],
                        type: 'any.only',
                        context: { value: 'a', valids: ['b'], label: 'value' }
                    }]
                }]
            ]);

            Helper.validate(a.concat(b), [
                ['b', true],
                ['a', false, null, {
                    message: '"value" must be one of [b]',
                    details: [{
                        message: '"value" must be one of [b]',
                        path: [],
                        type: 'any.only',
                        context: { value: 'a', valids: ['b'], label: 'value' }
                    }]
                }]
            ]);
        });

        it('merges two schemas (tests)', () => {

            const a = Joi.number().min(5);
            const b = Joi.number().max(10);

            Helper.validate(a, [
                [4, false, null, {
                    message: '"value" must be larger than or equal to 5',
                    details: [{
                        message: '"value" must be larger than or equal to 5',
                        path: [],
                        type: 'number.min',
                        context: { limit: 5, value: 4, label: 'value' }
                    }]
                }],
                [11, true]
            ]);

            Helper.validate(b, [
                [6, true],
                [11, false, null, {
                    message: '"value" must be less than or equal to 10',
                    details: [{
                        message: '"value" must be less than or equal to 10',
                        path: [],
                        type: 'number.max',
                        context: { limit: 10, value: 11, label: 'value' }
                    }]
                }]
            ]);

            Helper.validate(a.concat(b), [
                [4, false, null, {
                    message: '"value" must be larger than or equal to 5',
                    details: [{
                        message: '"value" must be larger than or equal to 5',
                        path: [],
                        type: 'number.min',
                        context: { limit: 5, value: 4, label: 'value' }
                    }]
                }],
                [6, true],
                [11, false, null, {
                    message: '"value" must be less than or equal to 10',
                    details: [{
                        message: '"value" must be less than or equal to 10',
                        path: [],
                        type: 'number.max',
                        context: { limit: 10, value: 11, label: 'value' }
                    }]
                }]
            ]);
        });

        it('merges two schemas (overlap rules)', () => {

            const a = Joi.number().min(5);
            const b = Joi.number().min(10);

            Helper.validate(a.concat(b), [
                [11, true],
                [4, false, null, {
                    message: '"value" must be larger than or equal to 10',
                    details: [{
                        message: '"value" must be larger than or equal to 10',
                        path: [],
                        type: 'number.min',
                        context: { limit: 10, value: 4, label: 'value' }
                    }]
                }],
                [6, false, null, {
                    message: '"value" must be larger than or equal to 10',
                    details: [{
                        message: '"value" must be larger than or equal to 10',
                        path: [],
                        type: 'number.min',
                        context: { limit: 10, value: 6, label: 'value' }
                    }]
                }]
            ]);
        });

        it('merges two schemas (flags)', () => {

            const a = Joi.string().valid('a');
            const b = Joi.string().insensitive();

            Helper.validate(a, [
                ['a', true],
                ['A', false, null, {
                    message: '"value" must be one of [a]',
                    details: [{
                        message: '"value" must be one of [a]',
                        path: [],
                        type: 'any.only',
                        context: { value: 'A', valids: ['a'], label: 'value' }
                    }]
                }],
                ['b', false, null, {
                    message: '"value" must be one of [a]',
                    details: [{
                        message: '"value" must be one of [a]',
                        path: [],
                        type: 'any.only',
                        context: { value: 'b', valids: ['a'], label: 'value' }
                    }]
                }]
            ]);

            Helper.validate(a.concat(b), [
                ['a', true, null, 'a'],
                ['A', true, null, 'a'],
                ['b', false, null, {
                    message: '"value" must be one of [a]',
                    details: [{
                        message: '"value" must be one of [a]',
                        path: [],
                        type: 'any.only',
                        context: { value: 'b', valids: ['a'], label: 'value' }
                    }]
                }]
            ]);
        });

        it('merges two schemas (flags with empty on both sides)', () => {

            const a = Joi.string().valid('a').empty('');
            const b = Joi.string().insensitive().empty(' ');

            Helper.validate(a, [
                ['a', true],
                ['A', false, null, {
                    message: '"value" must be one of [a]',
                    details: [{
                        message: '"value" must be one of [a]',
                        path: [],
                        type: 'any.only',
                        context: { value: 'A', valids: ['a'], label: 'value' }
                    }]
                }],
                ['b', false, null, {
                    message: '"value" must be one of [a]',
                    details: [{
                        message: '"value" must be one of [a]',
                        path: [],
                        type: 'any.only',
                        context: { value: 'b', valids: ['a'], label: 'value' }
                    }]
                }],
                ['', true, null, undefined],
                [' ', false, null, {
                    message: '"value" must be one of [a]',
                    details: [{
                        message: '"value" must be one of [a]',
                        path: [],
                        type: 'any.only',
                        context: { value: ' ', valids: ['a'], label: 'value' }
                    }]
                }]
            ]);

            const ab = a.concat(b);
            Helper.validate(ab, [
                ['a', true, null, 'a'],
                ['A', true, null, 'a'],
                ['b', false, null, {
                    message: '"value" must be one of [a]',
                    details: [{
                        message: '"value" must be one of [a]',
                        path: [],
                        type: 'any.only',
                        context: { value: 'b', valids: ['a'], label: 'value' }
                    }]
                }],
                ['', true, null, undefined],
                [' ', true, null, undefined]
            ]);

            expect(ab.describe()).to.equal({
                type: 'string',
                flags: {
                    only: true,
                    empty: {
                        type: 'any',
                        flags: { only: true },
                        allow: ['', ' ']
                    },
                    insensitive: true
                },
                allow: ['a']
            });
        });

        it('merges two schemas (flags with empty on one side)', () => {

            const a = Joi.string().valid('a').empty('');
            const b = Joi.string().insensitive();

            Helper.validate(a, [
                ['a', true],
                ['A', false, null, {
                    message: '"value" must be one of [a]',
                    details: [{
                        message: '"value" must be one of [a]',
                        path: [],
                        type: 'any.only',
                        context: { value: 'A', valids: ['a'], label: 'value' }
                    }]
                }],
                ['b', false, null, {
                    message: '"value" must be one of [a]',
                    details: [{
                        message: '"value" must be one of [a]',
                        path: [],
                        type: 'any.only',
                        context: { value: 'b', valids: ['a'], label: 'value' }
                    }]
                }],
                ['', true, null, undefined],
                [' ', false, null, {
                    message: '"value" must be one of [a]',
                    details: [{
                        message: '"value" must be one of [a]',
                        path: [],
                        type: 'any.only',
                        context: { value: ' ', valids: ['a'], label: 'value' }
                    }]
                }]
            ]);

            const ab = a.concat(b);
            Helper.validate(ab, [
                ['a', true, null, 'a'],
                ['A', true, null, 'a'],
                ['b', false, null, {
                    message: '"value" must be one of [a]',
                    details: [{
                        message: '"value" must be one of [a]',
                        path: [],
                        type: 'any.only',
                        context: { value: 'b', valids: ['a'], label: 'value' }
                    }]
                }],
                ['', true, null, undefined],
                [' ', false, null, {
                    message: '"value" must be one of [a]',
                    details: [{
                        message: '"value" must be one of [a]',
                        path: [],
                        type: 'any.only',
                        context: { value: ' ', valids: ['a'], label: 'value' }
                    }]
                }]
            ]);

            expect(ab.describe()).to.equal({
                type: 'string',
                flags: {
                    only: true,
                    empty: {
                        type: 'any',
                        flags: { only: true },
                        allow: ['']
                    },
                    insensitive: true
                },
                allow: ['a']
            });

            const ba = b.concat(a);
            Helper.validate(ba, [
                ['a', true, null, 'a'],
                ['A', true, null, 'a'],
                ['b', false, null, {
                    message: '"value" must be one of [a]',
                    details: [{
                        message: '"value" must be one of [a]',
                        path: [],
                        type: 'any.only',
                        context: { value: 'b', valids: ['a'], label: 'value' }
                    }]
                }],
                ['', true, null, undefined],
                [' ', false, null, {
                    message: '"value" must be one of [a]',
                    details: [{
                        message: '"value" must be one of [a]',
                        path: [],
                        type: 'any.only',
                        context: { value: ' ', valids: ['a'], label: 'value' }
                    }]
                }]
            ]);

            expect(ba.describe()).to.equal({
                type: 'string',
                flags: {
                    only: true,
                    empty: {
                        type: 'any',
                        flags: { only: true },
                        allow: ['']
                    },
                    insensitive: true
                },
                allow: ['a']
            });
        });

        it('overrides and append information', () => {

            const a = Joi.any().description('a').unit('a').tag('a').example('a');
            const b = Joi.any().description('b').unit('b').tag('b').example('b');

            const desc = a.concat(b).describe();
            expect(desc).to.equal({
                type: 'any',
                tags: ['a', 'b'],
                examples: ['a', 'b'],
                flags: {
                    description: 'b',
                    unit: 'b'
                }
            });
        });

        it('merges two objects (any key + specific key)', () => {

            const a = Joi.object();
            const b = Joi.object({ b: 1 });

            Helper.validate(a, [
                [{ b: 1 }, true],
                [{ b: 2 }, true]
            ]);

            Helper.validate(b, [
                [{ b: 1 }, true],
                [{ b: 2 }, false, null, {
                    message: '"b" must be one of [1]',
                    details: [{
                        message: '"b" must be one of [1]',
                        path: ['b'],
                        type: 'any.only',
                        context: { value: 2, valids: [1], label: 'b', key: 'b' }
                    }]
                }]
            ]);

            Helper.validate(a.concat(b), [
                [{ b: 1 }, true],
                [{ b: 2 }, false, null, {
                    message: '"b" must be one of [1]',
                    details: [{
                        message: '"b" must be one of [1]',
                        path: ['b'],
                        type: 'any.only',
                        context: { value: 2, valids: [1], label: 'b', key: 'b' }
                    }]
                }]
            ]);

            Helper.validate(b.concat(a), [
                [{ b: 1 }, true],
                [{ b: 2 }, false, null, {
                    message: '"b" must be one of [1]',
                    details: [{
                        message: '"b" must be one of [1]',
                        path: ['b'],
                        type: 'any.only',
                        context: { value: 2, valids: [1], label: 'b', key: 'b' }
                    }]
                }]
            ]);
        });

        it('merges two objects (no key + any key)', () => {

            const a = Joi.object({});
            const b = Joi.object();

            Helper.validate(a, [
                [{}, true],
                [{ b: 2 }, false, null, {
                    message: '"b" is not allowed',
                    details: [{
                        message: '"b" is not allowed',
                        path: ['b'],
                        type: 'object.unknown',
                        context: { child: 'b', label: 'b', key: 'b', value: 2 }
                    }]
                }]
            ]);

            Helper.validate(b, [
                [{}, true],
                [{ b: 2 }, true]
            ]);

            Helper.validate(a.concat(b), [
                [{}, true],
                [{ b: 2 }, false, null, {
                    message: '"b" is not allowed',
                    details: [{
                        message: '"b" is not allowed',
                        path: ['b'],
                        type: 'object.unknown',
                        context: { child: 'b', label: 'b', key: 'b', value: 2 }
                    }]
                }]
            ]);

            Helper.validate(b.concat(a), [
                [{}, true],
                [{ b: 2 }, false, null, {
                    message: '"b" is not allowed',
                    details: [{
                        message: '"b" is not allowed',
                        path: ['b'],
                        type: 'object.unknown',
                        context: { child: 'b', label: 'b', key: 'b', value: 2 }
                    }]
                }]
            ]);
        });

        it('merges two objects (key + key)', () => {

            const a = Joi.object({ a: 1 });
            const b = Joi.object({ b: 2 });

            Helper.validate(a, [
                [{ a: 1 }, true],
                [{ b: 2 }, false, null, {
                    message: '"b" is not allowed',
                    details: [{
                        message: '"b" is not allowed',
                        path: ['b'],
                        type: 'object.unknown',
                        context: { child: 'b', label: 'b', key: 'b', value: 2 }
                    }]
                }]
            ]);

            Helper.validate(b, [
                [{ a: 1 }, false, null, {
                    message: '"a" is not allowed',
                    details: [{
                        message: '"a" is not allowed',
                        path: ['a'],
                        type: 'object.unknown',
                        context: { child: 'a', label: 'a', key: 'a', value: 1 }
                    }]
                }],
                [{ b: 2 }, true]
            ]);

            Helper.validate(a.concat(b), [
                [{ a: 1 }, true],
                [{ b: 2 }, true]
            ]);

            Helper.validate(b.concat(a), [
                [{ a: 1 }, true],
                [{ b: 2 }, true]
            ]);
        });

        it('merges two objects (renames)', () => {

            const a = Joi.object({ a: 1 }).rename('c', 'a');
            const b = Joi.object({ b: 2 }).rename('d', 'b');

            expect(a.concat(b).validate({ c: 1, d: 2 })).to.equal({ value: { a: 1, b: 2 } });
        });

        it('merges two objects (deps)', () => {

            const a = Joi.object({ a: 1 });
            const b = Joi.object({ b: 2 }).and('b', 'a');

            expect(a.concat(b).validate({ a: 1, b: 2 }).error).to.not.exist();
        });

        it('merges two objects (same key)', () => {

            const a = Joi.object({ a: Joi.valid(1), b: Joi.valid(2), c: Joi.valid(3) });
            const b = Joi.object({ b: Joi.valid(1), c: Joi.valid(2), a: Joi.valid(3) });

            const ab = a.concat(b);

            Helper.validate(a, [
                [{ a: 1, b: 2, c: 3 }, true],
                [{ a: 3, b: 1, c: 2 }, false, null, {
                    message: '"a" must be one of [1]',
                    details: [{
                        message: '"a" must be one of [1]',
                        path: ['a'],
                        type: 'any.only',
                        context: { value: 3, valids: [1], label: 'a', key: 'a' }
                    }]
                }]
            ]);

            Helper.validate(b, [
                [{ a: 1, b: 2, c: 3 }, false, null, {
                    message: '"b" must be one of [1]',
                    details: [{
                        message: '"b" must be one of [1]',
                        path: ['b'],
                        type: 'any.only',
                        context: { value: 2, valids: [1], label: 'b', key: 'b' }
                    }]
                }],
                [{ a: 3, b: 1, c: 2 }, true]
            ]);

            Helper.validate(ab, [
                [{ a: 1, b: 2, c: 3 }, true],
                [{ a: 3, b: 1, c: 2 }, true],
                [{ a: 1, b: 2, c: 2 }, true],
                [{ a: 1, b: 2, c: 4 }, false, null, {
                    message: '"c" must be one of [3, 2]',
                    details: [{
                        message: '"c" must be one of [3, 2]',
                        path: ['c'],
                        type: 'any.only',
                        context: { value: 4, valids: [3, 2], label: 'c', key: 'c' }
                    }]
                }]
            ]);
        });

        it('merges two objects (same key, implicit override)', () => {

            const a = Joi.object({ a: 1, b: 2, c: 3 });
            const b = Joi.object({ b: 1, c: 2, a: 3 });

            const ab = a.concat(b);

            Helper.validate(a, [
                [{ a: 1, b: 2, c: 3 }, true],
                [{ a: 3, b: 1, c: 2 }, false, null, {
                    message: '"a" must be one of [1]',
                    details: [{
                        message: '"a" must be one of [1]',
                        path: ['a'],
                        type: 'any.only',
                        context: { value: 3, valids: [1], label: 'a', key: 'a' }
                    }]
                }]
            ]);

            Helper.validate(b, [
                [{ a: 3, b: 1, c: 2 }, true],
                [{ a: 1, b: 2, c: 3 }, false, null, {
                    message: '"b" must be one of [1]',
                    details: [{
                        message: '"b" must be one of [1]',
                        path: ['b'],
                        type: 'any.only',
                        context: { value: 2, valids: [1], label: 'b', key: 'b' }
                    }]
                }]
            ]);

            Helper.validate(ab, [
                [{ a: 3, b: 1, c: 2 }, true],
                [{ b: 2, c: 3 }, false, null, {
                    message: '"b" must be one of [1]',
                    details: [{
                        message: '"b" must be one of [1]',
                        path: ['b'],
                        type: 'any.only',
                        context: { value: 2, valids: [1], label: 'b', key: 'b' }
                    }]
                }],
                [{ a: 1, b: 2, c: 3 }, false, null, {
                    message: '"a" must be one of [3]',
                    details: [{
                        message: '"a" must be one of [3]',
                        path: ['a'],
                        type: 'any.only',
                        context: { value: 1, valids: [3], label: 'a', key: 'a' }
                    }]
                }]
            ]);
        });

        it('merges two objects (same key, explicit override)', () => {

            const a = Joi.object({ a: Joi.valid(Joi.override, 1), b: Joi.valid(Joi.override, 2), c: Joi.valid(Joi.override, 3) });
            const b = Joi.object({ b: Joi.valid(Joi.override, 1), c: Joi.valid(Joi.override, 2), a: Joi.valid(Joi.override, 3) });

            const ab = a.concat(b);

            Helper.validate(a, [
                [{ a: 1, b: 2, c: 3 }, true],
                [{ a: 3, b: 1, c: 2 }, false, null, {
                    message: '"a" must be one of [1]',
                    details: [{
                        message: '"a" must be one of [1]',
                        path: ['a'],
                        type: 'any.only',
                        context: { value: 3, valids: [1], label: 'a', key: 'a' }
                    }]
                }]
            ]);

            Helper.validate(b, [
                [{ a: 3, b: 1, c: 2 }, true],
                [{ a: 1, b: 2, c: 3 }, false, null, {
                    message: '"b" must be one of [1]',
                    details: [{
                        message: '"b" must be one of [1]',
                        path: ['b'],
                        type: 'any.only',
                        context: { value: 2, valids: [1], label: 'b', key: 'b' }
                    }]
                }]
            ]);

            Helper.validate(ab, [
                [{ a: 3, b: 1, c: 2 }, true],
                [{ b: 2, c: 3 }, false, null, {
                    message: '"b" must be one of [1]',
                    details: [{
                        message: '"b" must be one of [1]',
                        path: ['b'],
                        type: 'any.only',
                        context: { value: 2, valids: [1], label: 'b', key: 'b' }
                    }]
                }],
                [{ a: 1, b: 2, c: 3 }, false, null, {
                    message: '"a" must be one of [3]',
                    details: [{
                        message: '"a" must be one of [3]',
                        path: ['a'],
                        type: 'any.only',
                        context: { value: 1, valids: [3], label: 'a', key: 'a' }
                    }]
                }]
            ]);
        });

        it('throws when schema key types do not match', () => {

            const a = Joi.object({ a: Joi.number() });
            const b = Joi.object({ a: Joi.string() });

            expect(() => {

                a.concat(b);
            }).to.throw('Cannot merge type number with another type: string');
        });

        it('merges two alternatives with references', () => {

            const ref1 = Joi.ref('a.c');
            const ref2 = Joi.ref('c');
            const schema = Joi.object({
                a: { c: Joi.number() },
                b: Joi.alternatives(ref1).concat(Joi.alternatives(ref2)),
                c: Joi.number()
            });

            Helper.validate(schema, [
                [{ a: {} }, true],
                [{ a: { c: '5' }, b: 5 }, true],
                [{ a: { c: '5' }, b: 6, c: '6' }, true],
                [{ a: { c: '5' }, b: 7, c: '6' }, false, null, {
                    message: '"b" does not match any of the allowed types',
                    details: [
                        {
                            message: '"b" does not match any of the allowed types',
                            type: 'alternatives.match',
                            path: ['b'],
                            context: {
                                key: 'b',
                                label: 'b',
                                message: '"b" must be one of [ref:a.c]. "b" must be one of [ref:c]',
                                value: 7,
                                details: [
                                    {
                                        message: '"b" must be one of [ref:a.c]',
                                        path: ['b'],
                                        type: 'any.only',
                                        context: { value: 7, valids: [ref1], label: 'b', key: 'b' }
                                    },
                                    {
                                        message: '"b" must be one of [ref:c]',
                                        path: ['b'],
                                        type: 'any.only',
                                        context: { value: 7, valids: [ref2], label: 'b', key: 'b' }
                                    }
                                ]
                            }
                        }
                    ]
                }]
            ]);
        });

        it('merges meta properly', () => {

            const metaA = { a: 1 };
            const metaB = { b: 1 };
            const a = Joi.any().meta(metaA);
            const b = Joi.any().meta(metaB);
            const c = Joi.any();
            const d = Joi.any();

            expect(a.concat(b).describe().metas).to.equal([{ a: 1 }, { b: 1 }]);
            expect(a.concat(c).describe().metas).to.equal([metaA]);
            expect(b.concat(c).describe().metas).to.equal([metaB]);
            expect(c.concat(d).describe().metas).to.not.exist();
        });

        it('merges into an any', () => {

            const a = Joi.any().required();
            const b = Joi.number().valid(0);

            expect(() => {

                a.concat(b);
            }).to.not.throw();

            const schema = a.concat(b);
            expect(schema.validate().error.message).to.equal('"value" is required');
            expect(schema.validate().error.details).to.equal([{
                message: '"value" is required',
                path: [],
                type: 'any.required',
                context: { label: 'value' }
            }]);

            expect(schema.validate(1).error.message).to.equal('"value" must be one of [0]');
            expect(schema.validate(1).error.details).to.equal([{
                message: '"value" must be one of [0]',
                path: [],
                type: 'any.only',
                context: { value: 1, valids: [0], label: 'value' }
            }]);
        });
    });

    describe('default()', () => {

        it('sets the value', () => {

            const schema = Joi.object({ foo: Joi.string().default('test') });
            const input = {};
            expect(schema.validate(input)).to.equal({ value: { foo: 'test' } });
        });

        it('allows passing description as a property of a default method', () => {

            const defaultFn = function () {

                return 'test';
            };

            defaultFn.description = 'test';

            expect(() => {

                Joi.object({ foo: Joi.string().default(defaultFn) });
            }).to.not.throw();
        });

        it('sets the value when passing a method', () => {

            const schema = Joi.object({
                foo: Joi.string().default(() => {

                    return 'test';
                })
            });

            const input = {};
            expect(schema.validate(input)).to.equal({ value: { foo: 'test' } });
        });

        it('executes the default method each time validate is called', () => {

            let count = 0;
            const schema = Joi.object({
                foo: Joi.number().default(() => {

                    return ++count;
                })
            });

            const input = {};
            expect(schema.validate(input)).to.equal({ value: { foo: 1 } });
            expect(schema.validate(input)).to.equal({ value: { foo: 2 } });
        });

        it('passes a clone of the context if the default method accepts an argument', () => {

            const schema = Joi.object({
                foo: Joi.string().default((context) => {

                    return context.bar + 'ing';
                }),
                bar: Joi.string()
            });

            const input = { bar: 'test' };
            expect(schema.validate(input)).to.equal({ value: { bar: 'test', foo: 'testing' } });
        });

        it('does not modify the original object when modifying the clone in a default method', () => {

            const defaultFn = function (context) {

                context.bar = 'broken';
                return 'test';
            };

            defaultFn.description = 'testing';

            const schema = Joi.object({
                foo: Joi.string().default(defaultFn),
                bar: Joi.string()
            });

            const input = { bar: 'test' };
            expect(schema.validate(input)).to.equal({ value: { bar: 'test', foo: 'test' } });
        });

        it('passes undefined as the context if the default method has no parent', () => {

            let c;
            let methodCalled = false;
            const schema = Joi.string().default((context) => {

                methodCalled = true;
                c = context;
                return 'test';
            });

            expect(schema.validate(undefined)).to.equal({ value: 'test' });
            expect(methodCalled).to.equal(true);
            expect(c).to.equal(undefined);
        });

        it('sets literal function default', () => {

            const func = () => 'just a function';
            const schema = Joi.function().default(func, { literal: true });
            expect(schema.validate(undefined)).to.equal({ value: func });
        });

        it('allows passing a method that generates a default method when validating a function', () => {

            const defaultFn = function () {

                return 'just a function';
            };

            const defaultGeneratorFn = function () {

                return defaultFn;
            };

            const schema = Joi.function().default(defaultGeneratorFn);
            expect(schema.validate(undefined)).to.equal({ value: defaultFn });
        });

        it('allows passing a ref as a default without a description', () => {

            const schema = Joi.object({
                a: Joi.string(),
                b: Joi.string().default(Joi.ref('a'))
            });

            expect(schema.validate({ a: 'test' })).to.equal({ value: { a: 'test', b: 'test' } });
        });

        it('ignores description when passing a ref as a default', () => {

            const schema = Joi.object({
                a: Joi.string(),
                b: Joi.string().default(Joi.ref('a'))
            });

            expect(schema.validate({ a: 'test' })).to.equal({ value: { a: 'test', b: 'test' } });
        });

        it('catches errors in default methods', () => {

            const error = new Error('boom');
            const defaultFn = function () {

                throw error;
            };

            defaultFn.description = 'broken method';

            const schema = Joi.string().default(defaultFn);

            const err = schema.validate(undefined).error;
            expect(err.details).to.have.length(1);
            expect(err.details).to.equal([{
                message: '"value" threw an error when running default method',
                path: [],
                type: 'any.default',
                context: { error, label: 'value', value: null }
            }]);
        });

        it('should not overide a value when value is given', () => {

            const schema = Joi.object({ foo: Joi.string().default('bar') });
            const input = { foo: 'test' };
            expect(schema.validate(input)).to.equal({ value: { foo: 'test' } });
        });

        it('sets value based on condition (outer)', () => {

            const schema = Joi.object({
                a: Joi.boolean(),
                b: Joi.boolean()
                    .default(false)
                    .when('a', { is: true, then: Joi.required(), otherwise: Joi.forbidden() })
            });

            expect(schema.validate({ a: false })).to.equal({ value: { a: false, b: false } });
        });

        it('sets value based on condition (inner)', () => {

            const schema = Joi.object({
                a: Joi.boolean(),
                b: Joi.boolean().when('a', { is: true, then: Joi.any().default(false), otherwise: Joi.forbidden() })
            });

            expect(schema.validate({ a: true })).to.equal({ value: { a: true, b: false } });
        });

        it('creates deep defaults', () => {

            const schema = Joi.object({
                a: Joi.number().default(42),
                b: Joi.object({
                    c: Joi.boolean().default(true),
                    d: Joi.string()
                })
                    .default()
            })
                .default();

            Helper.validate(schema, [
                [undefined, true, null, { a: 42, b: { c: true } }],
                [{ a: 24 }, true, null, { a: 24, b: { c: true } }]
            ]);
        });

        it('errors when missing value on non-object schemas', () => {

            expect(() => Joi.number().default()).to.throw('Missing default value');
        });

        it('should set default value as a clone', () => {

            const defaultValue = { bar: 'val' };
            const schema = Joi.object({ foo: Joi.object().default(defaultValue) });
            const input = {};

            const value = schema.validate(input).value;
            expect(value.foo).to.not.shallow.equal(defaultValue);
            expect(value.foo).to.only.include({ bar: 'val' });

            value.foo.bar = 'mutated';

            const value2 = schema.validate(input).value;
            expect(value2.foo).to.not.shallow.equal(defaultValue);
            expect(value2.foo).to.only.include({ bar: 'val' });
        });

        it('should not apply default values if the noDefaults option is enquire', () => {

            const schema = Joi.object({
                a: Joi.string().default('foo'),
                b: Joi.number()
            });

            const input = { b: 42 };
            expect(schema.validate(input, { noDefaults: true })).to.equal({ value: { b: 42 } });
        });

        it('should not apply default values from functions if the noDefaults option is enquire', () => {

            const func = function (context) {

                return 'foo';
            };

            func.description = 'test parameter';

            const schema = Joi.object({
                a: Joi.string().default(func),
                b: Joi.number()
            });

            const input = { b: 42 };
            expect(schema.validate(input, { noDefaults: true })).to.equal({ value: { b: 42 } });
        });

        it('should not apply default values from references if the noDefaults option is enquire', () => {

            const schema = Joi.object({
                a: Joi.string().default(Joi.ref('b')),
                b: Joi.number()
            });

            const input = { b: 42 };
            expect(schema.validate(input, { noDefaults: true })).to.equal({ value: { b: 42 } });
        });

        it('should be able to support both empty and noDefaults', () => {

            const schema = Joi.object({
                a: Joi.string().empty('foo').default('bar'),
                b: Joi.number()
            });

            const input = { a: 'foo', b: 42 };
            expect(schema.validate(input, { noDefaults: true })).to.equal({ value: { b: 42 } });
        });
    });

    describe('description()', () => {

        it('sets the description', () => {

            const b = Joi.any().description('my description');
            expect(b.describe().flags.description).to.equal('my description');
        });

        it('throws when description is missing', () => {

            expect(() => Joi.any().description()).to.throw('Description must be a non-empty string');
        });
    });

    describe('empty()', () => {

        it('should void values when considered empty', () => {

            const schema = Joi.string().empty('');
            Helper.validate(schema, [
                [undefined, true, null, undefined],
                ['abc', true, null, 'abc'],
                ['', true, null, undefined]
            ]);
        });

        it('should void values with trim', () => {

            const schema = Joi.string().empty('').trim();
            Helper.validate(schema, [
                [undefined, true, null, undefined],
                ['abc', true, null, 'abc'],
                ['', true, null, undefined],
                [' ', true, null, undefined],
                ['       ', true, null, undefined],
                [42, false, null, {
                    message: '"value" must be a string',
                    details: [{
                        message: '"value" must be a string',
                        path: [],
                        type: 'string.base',
                        context: { value: 42, label: 'value' }
                    }]
                }]
            ]);

            Helper.validate(schema.trim(false), [
                [undefined, true, null, undefined],
                ['abc', true, null, 'abc'],
                ['', true, null, undefined],
                [' ', true, null, ' ']
            ]);
        });

        it('should override any previous empty', () => {

            const schema = Joi.string().empty('').empty('abc');
            Helper.validate(schema, [
                [undefined, true, null, undefined],
                ['abc', true, null, undefined],
                ['', false, null, {
                    message: '"value" is not allowed to be empty',
                    details: [{
                        message: '"value" is not allowed to be empty',
                        path: [],
                        type: 'string.empty',
                        context: { value: '', label: 'value' }
                    }]
                }],
                ['def', true, null, 'def']
            ]);
        });

        it('should be possible to reset the empty value', () => {

            const schema = Joi.string().empty('').empty();
            Helper.validate(schema, [
                [undefined, true, null, undefined],
                ['abc', true, null, 'abc'],
                ['', false, null, {
                    message: '"value" is not allowed to be empty',
                    details: [{
                        message: '"value" is not allowed to be empty',
                        path: [],
                        type: 'string.empty',
                        context: { value: '', label: 'value' }
                    }]
                }]
            ]);
        });

        it('should have no effect if only reset is used', () => {

            const schema = Joi.string().empty();
            Helper.validate(schema, [
                [undefined, true, null, undefined],
                ['abc', true, null, 'abc'],
                ['', false, null, {
                    message: '"value" is not allowed to be empty',
                    details: [{
                        message: '"value" is not allowed to be empty',
                        path: [],
                        type: 'string.empty',
                        context: { value: '', label: 'value' }
                    }]
                }]
            ]);
        });

        it('should remove empty flag if only reset is used', () => {

            const schema = Joi.string().empty('').empty();
            expect(schema._flags.empty).to.not.exist();
            expect(schema.describe().flags).to.not.exist();
        });

        it('should work with dependencies', () => {

            const schema = Joi.object({
                a: Joi.string().empty(''),
                b: Joi.string().empty('')
            }).or('a', 'b');

            Helper.validate(schema, [
                [{}, false, null, {
                    message: '"value" must contain at least one of [a, b]',
                    details: [{
                        message: '"value" must contain at least one of [a, b]',
                        path: [],
                        type: 'object.missing',
                        context: {
                            peers: ['a', 'b'],
                            peersWithLabels: ['a', 'b'],
                            label: 'value',
                            value: {}
                        }
                    }]
                }],
                [{ a: '' }, false, null, {
                    message: '"value" must contain at least one of [a, b]',
                    details: [{
                        message: '"value" must contain at least one of [a, b]',
                        path: [],
                        type: 'object.missing',
                        context: {
                            peers: ['a', 'b'],
                            peersWithLabels: ['a', 'b'],
                            label: 'value',
                            value: {}
                        }
                    }]
                }],
                [{ a: 'a' }, true, null, { a: 'a' }],
                [{ a: '', b: 'b' }, true, null, { b: 'b' }]
            ]);
        });

        it('supports references', () => {

            const schema = Joi.object({
                empty: Joi.string(),
                a: Joi.string().empty(Joi.ref('empty'))
            });

            Helper.validate(schema, [
                [{ empty: 'x', a: 'x' }, true, null, { empty: 'x' }],
                [{ empty: 'y', a: 'x' }, true, null, { empty: 'y', a: 'x' }]
            ]);
        });
    });

    describe('equal()', () => {

        it('validates valid values', () => {

            Helper.validate(Joi.equal(4), [
                [4, true],
                [5, false, null, {
                    message: '"value" must be one of [4]',
                    details: [{
                        message: '"value" must be one of [4]',
                        path: [],
                        type: 'any.only',
                        context: { value: 5, valids: [4], label: 'value' }
                    }]
                }]
            ]);
        });
    });

    describe('error()', () => {

        it('returns custom error', () => {

            const schema = Joi.object({
                a: Joi.string(),
                b: {
                    c: Joi.number().strict().error(new Error('Really wanted a number!'))
                }
            });

            const err = schema.validate({ a: 'abc', b: { c: 'x' } }).error;
            expect(err.isJoi).to.not.exist();
            expect(err.message).to.equal('Really wanted a number!');
            expect(err.details).to.not.exist();
        });

        it('returns first custom error with multiple errors', () => {

            const schema = Joi.object({
                a: Joi.string(),
                b: {
                    c: Joi.number().error(new Error('Really wanted a number!'))
                }
            }).prefs({ abortEarly: false });

            const err = schema.validate({ a: 22, b: { c: 'x' } }).error;
            expect(err.isJoi).to.not.exist();
            expect(err.message).to.equal('Really wanted a number!');
            expect(err.details).to.not.exist();
        });

        it('returns first error with multiple errors (first not custom)', () => {

            const schema = Joi.object({
                a: Joi.string(),
                b: {
                    c: Joi.number().error(new Error('Really wanted a number!'))
                }
            });

            const err = schema.validate({ a: 22, b: { c: 'x' } }).error;
            expect(err.isJoi).to.be.true();
            expect(err.message).to.equal('"a" must be a string');
            expect(err.details).to.equal([{
                message: '"a" must be a string',
                path: ['a'],
                type: 'string.base',
                context: { value: 22, label: 'a', key: 'a' }
            }]);
        });

        it('errors on invalid error option', () => {

            expect(() => {

                Joi.object({
                    a: Joi.string(),
                    b: {
                        c: Joi.number().error('Really wanted a number!')
                    }
                });
            }).to.throw('Must provide a valid Error object or a function');

        });

        it('errors on missing error option', () => {

            expect(() => {

                Joi.object({
                    a: Joi.string(),
                    b: {
                        c: Joi.number().error()
                    }
                });
            }).to.throw('Missing error');

        });

        describe('with a function', () => {

            it('replaces the error message with an error', () => {

                const schema = Joi.object({
                    a: Joi.string(),
                    b: {
                        c: Joi.number().strict().error(() => new Error('Really wanted a number!'))
                    }
                });

                const err = schema.validate({ a: 'abc', b: { c: 'x' } }).error;
                expect(err.isJoi).to.not.exist();
                expect(err.message).to.equal('Really wanted a number!');
            });

            it('should be able to combine several error messages', () => {

                const schema = Joi.object({
                    a: Joi.string(),
                    b: {
                        c: Joi.number().min(0).integer().strict().error((errors) => {

                            return new Error(errors.join(' and ')); // Automatic toString() of each error on join
                        })
                    }
                });

                const err = schema.validate({ a: 'abc', b: { c: -1.5 } }, { abortEarly: false }).error;
                expect(err.isJoi).to.not.exist();
                expect(err.message).to.equal('"b.c" must be larger than or equal to 0 and "b.c" must be an integer');
            });

            it('caches report message string', () => {

                const schema = Joi.object({
                    a: Joi.string(),
                    b: {
                        c: Joi.number().min(0).integer().strict().error((errors) => {

                            for (const err of errors) {
                                err.toString();
                                err.message += '!';
                            }

                            return new Error(errors.join(' and ')); // Automatic toString() of each error on join
                        })
                    }
                });

                const err = schema.validate({ a: 'abc', b: { c: -1.5 } }, { abortEarly: false }).error;
                expect(err.isJoi).to.not.exist();
                expect(err.message).to.equal('"b.c" must be larger than or equal to 0! and "b.c" must be an integer!');
            });

            it('uses selected date format', () => {

                const min = new Date('1974-05-07');

                const schema = Joi.object({
                    a: Joi.date().min(min).greater(min).error((errors) => {

                        return new Error(errors.join(' and ')); // Automatic toString() of each error on join
                    })
                });

                const err = schema.validate({ a: new Date('1973-01-01') }, { dateFormat: 'date', abortEarly: false }).error;
                expect(err.isJoi).to.not.exist();
                expect(err.message).to.equal(`"a" must be larger than or equal to "${min.toDateString()}" and "a" must be greater than "${min.toDateString()}"`);
            });

            it('should be able to combine several error messages using context', () => {

                const schema = Joi.object({
                    a: Joi.string(),
                    b: {
                        c: Joi.number().min(0).integer().strict().error((errors) => {

                            const message = errors.reduce((memo, error) => {

                                let text = memo ? ' && ' : '';
                                switch (error.code) {
                                    case 'number.base':
                                        text += `"${error.local.key}" ∈ ℝ`;
                                        break;
                                    case 'number.min':
                                        text += `"${error.local.key}" > ${error.local.limit}`;
                                        break;
                                    case 'number.integer':
                                        text += `"${error.local.key}" ∈ ℤ`;
                                        break;
                                }

                                return memo + text;
                            }, '');

                            return new Error(message);
                        })
                    }
                });

                const err = schema.validate({ a: 'abc', b: { c: -1.5 } }, { abortEarly: false }).error;
                expect(err.isJoi).to.not.exist();
                expect(err.message).to.equal('"c" > 0 && "c" ∈ ℤ');
            });

            it('should be able to return a javascript Error', () => {

                const schema = Joi.object({
                    a: Joi.string(),
                    b: {
                        c: Joi.number().min(0).integer().strict().error((errors) => new Error(`error of type ${errors[0].code}`))
                    }
                });

                const err = schema.validate({ a: 'abc', b: { c: -1.5 } }, { abortEarly: false }).error;
                expect(err).to.be.an.error('error of type number.min');
                expect(err.isJoi).to.not.exist();
                expect(err.details).to.not.exist();
            });

            it('handles multiple errors return value', () => {

                const item = Joi.string()
                    .trim()
                    .regex(/^\w*$/)
                    .error((errors) => {

                        const error = errors[0];
                        if (error.code === 'string.pattern.base') {
                            error.message = 'my new error message';
                        }

                        return errors;
                    });

                const schema = Joi.object({
                    a: Joi.array().items(item.min(2).max(64)),
                    b: item
                });

                expect(schema.validate({ a: [' xx', 'yy'], b: ' x' }).value).to.equal({ a: ['xx', 'yy'], b: 'x' });

                const result1 = schema.validate({ a: [' xx', 'yy'], b: ' x?' });
                expect(result1.value).to.equal({ a: ['xx', 'yy'], b: ' x?' });
                expect(result1.error).to.be.an.error('my new error message');

                const result2 = schema.validate({ a: [' xx', 'yy?'], b: ' x' });
                expect(result2.value).to.equal({ a: [' xx', 'yy?'], b: ' x' });
                expect(result2.error).to.be.an.error('my new error message');
            });
        });
    });

    describe('example()', () => {

        it('sets an example', () => {

            const schema = Joi.valid(5, 6, 7).example(5);
            expect(schema.describe().examples).to.equal([5]);
        });

        it('appends examples', () => {

            const schema = Joi.valid(5, 6, 7).example(4).example(5);
            expect(schema.describe().examples).to.equal([4, 5]);
        });

        it('overrides example', () => {

            const schema = Joi.valid(5, 6, 7).example(4).example(5, { override: true });
            expect(schema.describe().examples).to.equal([5]);
        });

        it('does not flatten examples', () => {

            const schema = Joi.array().items(5, 6, 7).example([5, 6]);
            expect(schema.describe().examples).to.equal([[5, 6]]);
        });

        it('throws when examples are missing', () => {

            expect(() => Joi.any().example()).to.throw('Missing example');
        });
    });

    describe('exist()', () => {

        it('validates required values', () => {

            Helper.validate(Joi.exist(), [
                [0, true],
                [null, true],
                ['', true],
                [false, true],
                [undefined, false, null, {
                    message: '"value" is required',
                    details: [{
                        message: '"value" is required',
                        path: [],
                        type: 'any.required',
                        context: { label: 'value' }
                    }]
                }]
            ]);
        });
    });

    describe('external()', () => {

        it('errors on invalid arguments', () => {

            const method = () => null;
            expect(() => Joi.any().external(method, '')).to.throw('Description must be a non-empty string');
            expect(() => Joi.any().external(method, 0)).to.throw('Description must be a non-empty string');
            expect(() => Joi.any().external(method, [])).to.throw('Description must be a non-empty string');
            expect(() => Joi.any().external({ method }, 'text')).to.throw('Cannot combine options with description');
        });

        it('includes description in manifest', () => {

            const method = () => null;
            const schema = Joi.any().external(method, 'some description');
            expect(schema.describe()).to.equal({
                type: 'any',
                externals: [
                    {
                        description: 'some description',
                        method
                    }
                ]
            });
        });
    });

    describe('failover()', () => {

        it('sets value on error', () => {

            const schema = Joi.object({ x: Joi.number().default(1).failover(2) });

            expect(schema.validate({})).to.equal({ value: { x: 1 } });
            expect(schema.validate({ x: 3 })).to.equal({ value: { x: 3 } });
            expect(schema.validate({ x: [] })).to.equal({ value: { x: 2 } });
        });
    });

    describe('forbidden()', () => {

        it('validates forbidden', () => {

            const schema = Joi.object({
                a: Joi.number(),
                b: Joi.forbidden()
            });

            Helper.validate(schema, [
                [{ a: 5 }, true],
                [{ a: 5, b: 6 }, false, null, {
                    message: '"b" is not allowed',
                    details: [{
                        message: '"b" is not allowed',
                        path: ['b'],
                        type: 'any.unknown',
                        context: { label: 'b', key: 'b', value: 6 }
                    }]
                }],
                [{ a: 'a' }, false, null, {
                    message: '"a" must be a number',
                    details: [{
                        message: '"a" must be a number',
                        path: ['a'],
                        type: 'number.base',
                        context: { label: 'a', key: 'a', value: 'a' }
                    }]
                }],
                [{}, true],
                [{ b: undefined }, true],
                [{ b: null }, false, null, {
                    message: '"b" is not allowed',
                    details: [{
                        message: '"b" is not allowed',
                        path: ['b'],
                        type: 'any.unknown',
                        context: { label: 'b', key: 'b', value: null }
                    }]
                }]
            ]);
        });

        it('avoids unnecessary cloning when called twice', () => {

            const schema = Joi.any().forbidden();
            expect(schema.forbidden()).to.shallow.equal(schema);
        });
    });

    describe('invalid()', () => {

        it('allows invalid values to be set', () => {

            expect(() => Joi.any().valid(true, 1, 'hello', new Date(), Symbol('foo'))).not.to.throw();
        });

        it('throws when passed undefined', () => {

            expect(() => {

                Joi.any().invalid(undefined);
            }).to.throw('Cannot call allow/valid/invalid with undefined');
        });

        it('preserves passed value when cloned', () => {

            const o = {};
            expect(Joi.object().invalid(o).clone().validate(o).error).to.be.an.error('"value" contains an invalid value');
            expect(Joi.object().invalid(o).clone().validate({}).error).to.not.exist();
        });

        it('errors on blocked schema', () => {

            expect(() => Joi.any().valid(1).invalid(1)).to.throw('Setting invalid value 1 leaves schema rejecting all values due to previous valid rule');
            expect(() => Joi.any().allow(1).invalid(1)).to.not.throw();
        });

        it('appends invalid values', () => {

            const schema = Joi.any().invalid(1).invalid(2);
            expect(schema.describe()).to.equal({ type: 'any', invalid: [1, 2] });
        });

        it('throws when override is not first item', () => {

            expect(() => Joi.any().invalid(1, Joi.override)).to.throw('Override must be the first value');
        });

        it('overrides previous values', () => {

            const schema = Joi.number().invalid(2).invalid(Joi.override, 1);
            expect(schema.validate(1).error).to.be.an.error('"value" contains an invalid value');
            expect(schema.validate(2).error).to.not.exist();
        });

        it('cancels previous values', () => {

            const schema = Joi.number().invalid(2).invalid(Joi.override);
            expect(schema.validate(1).error).to.not.exist();
            expect(schema.validate(2).error).to.not.exist();
        });

        it('ignores empty override', () => {

            const schema = Joi.invalid(Joi.override);
            expect(schema._invalids).to.be.null();
        });
    });

    describe('keep()', () => {

        it('retains both unique rule instances', () => {

            const schema = Joi.number()
                .min(10).keep()
                .min(100);

            expect(schema.validate(1, { abortEarly: false }).error).to.be.an.error('"value" must be larger than or equal to 10. "value" must be larger than or equal to 100');
        });

        it('retains both unique rule instances in concat', () => {

            const schema = Joi.number()
                .min(10).keep()
                .concat(Joi.number().min(100));

            expect(schema.validate(1, { abortEarly: false }).error).to.be.an.error('"value" must be larger than or equal to 10. "value" must be larger than or equal to 100');
        });
    });

    describe('label()', () => {

        it('adds to existing options', () => {

            const schema = Joi.object({ b: Joi.string().email().label('Custom label') });
            const input = { b: 'not_a_valid_email' };
            const err = schema.validate(input).error;
            expect(err.details[0]).to.equal({
                message: '"Custom label" must be a valid email',
                path: ['b'],
                type: 'string.email',
                context: { value: 'not_a_valid_email', invalids: ['not_a_valid_email'], label: 'Custom label', key: 'b' }
            });
        });

        it('throws when label is missing', () => {

            expect(() => {

                Joi.any().label();
            }).to.throw('Label name must be a non-empty string');
        });

        it('can describe a label', () => {

            const schema = Joi.object().label('lbl').describe();
            expect(schema).to.equal({ type: 'object', flags: { label: 'lbl' } });
        });

        it('does not leak into sub objects', () => {

            const schema = Joi.object({ a: Joi.number() }).label('foo');
            const err = schema.validate({ a: 'a' }).error;
            expect(err).to.be.an.error('"a" must be a number');
            expect(err.details).to.equal([{
                message: '"a" must be a number',
                path: ['a'],
                type: 'number.base',
                context: { label: 'a', key: 'a', value: 'a' }
            }]);
        });

        it('does not leak into sub objects from an array', () => {

            const schema = Joi.array().items(
                Joi.object({ a: Joi.number() }).label('foo')
            ).label('bar');

            const err = schema.validate([{ a: 'a' }]).error;
            expect(err).to.be.an.error('"[0].a" must be a number');
            expect(err.details).to.equal([{
                message: '"[0].a" must be a number',
                path: [0, 'a'],
                type: 'number.base',
                context: { label: '[0].a', key: 'a', value: 'a' }
            }]);
        });

        it('does not leak into unknown keys', () => {

            const schema = Joi.object({ a: Joi.number() }).label('foo');
            const err = schema.validate({ b: 'a' }).error;
            expect(err).to.be.an.error('"b" is not allowed');
            expect(err.details).to.equal([{
                message: '"b" is not allowed',
                path: ['b'],
                type: 'object.unknown',
                context: { child: 'b', label: 'b', key: 'b', value: 'a' }
            }]);
        });

        it('applies only to hierarchy edge', () => {

            const schema = Joi.object({
                a: Joi.object({
                    b: Joi.object({
                        c: Joi.number().label('C')
                    }).label('B')
                }).label('A')
            });

            const err = schema.validate({ a: { b: { c: 'x' } } }).error;
            expect(err).to.be.an.error('"C" must be a number');
            expect(err.details).to.equal([
                {
                    message: '"C" must be a number',
                    path: ['a', 'b', 'c'],
                    type: 'number.base',
                    context: { label: 'C', value: 'x', key: 'c' }
                }
            ]);
        });
    });

    describe('message()', () => {

        it('overrides message', () => {

            const schema = Joi.number()
                .min(10).message('way too small')
                .max(100).message('way too big');

            expect(schema.validate(1).error).to.be.an.error('way too small');
            expect(schema.validate(1000).error).to.be.an.error('way too big');
        });

        it('overrides message with template', () => {

            const schema = Joi.number()
                .min(10).message(Joi.x('way too small'));

            expect(schema.validate(1).error).to.be.an.error('way too small');
        });

        it('overrides message in multiple language', () => {

            const messages = {
                english: {
                    root: 'value',
                    'number.min': '{#label} too small'
                },
                latin: {
                    root: 'valorem',
                    'number.min': Joi.x('{@label} angustus', { prefix: { local: '@' } })
                }
            };

            const schema = Joi.number().min(10).message(messages);

            expect(schema.validate(1, { errors: { language: 'english' } }).error).to.be.an.error('value too small');
            expect(schema.validate(1, { errors: { language: 'latin' } }).error).to.be.an.error('valorem angustus');
            expect(schema.validate(1, { errors: { language: 'unknown' } }).error).to.be.an.error('"value" must be larger than or equal to 10');
            expect(schema.label('special').validate(1, { errors: { language: 'english' } }).error).to.be.an.error('special too small');
        });

        it('overrides message in multiple language (nested)', () => {

            const messages = {
                english: {
                    root: 'value',
                    'number.min': '{#label} too small'
                },
                latin: {
                    root: 'valorem',
                    'number.min': '{#label} angustus'
                }
            };

            const schema = Joi.object({ a: Joi.number().min(10).message(messages) });

            expect(schema.validate({ a: 1 }, { errors: { language: 'english' } }).error).to.be.an.error('a too small');
            expect(schema.validate({ a: 1 }, { errors: { language: 'latin' } }).error).to.be.an.error('a angustus');
            expect(schema.validate({ a: 1 }, { errors: { language: 'unknown' } }).error).to.be.an.error('"a" must be larger than or equal to 10');
        });

        it('overrides message in multiple language (flat)', () => {

            const messages = {
                root: 'valorem',
                'number.min': '{#label} angustus'
            };

            const schema = Joi.object({ a: Joi.number().min(10).message(messages) });
            expect(schema.validate({ a: 1 }).error).to.be.an.error('a angustus');
        });

        it('overrides message in multiple language (flat template)', () => {

            const messages = {
                root: 'valorem',
                'number.min': Joi.x('{@label} angustus', { prefix: { local: '@' } })
            };

            const schema = Joi.object({ a: Joi.number().min(10).message(messages) });
            expect(schema.validate({ a: 1 }).error).to.be.an.error('a angustus');
        });

        it('errors on invalid message value', () => {

            expect(() => Joi.number().min(10).message(12)).to.throw('Invalid message options');
            expect(() => Joi.number().min(10).message({ 'number.min': 12 })).to.throw('Invalid message for number.min');
            expect(() => Joi.number().min(10).message({ english: { 'number.min': 12 } })).to.throw('Invalid message for number.min in english');
        });
    });

    describe('meta()', () => {

        it('sets the meta', () => {

            const meta = { prop: 'val', prop2: 3 };
            let b = Joi.any().meta(meta);
            expect(b.describe().metas).to.equal([meta]);

            b = b.meta({ other: true });
            expect(b.describe().metas).to.equal([meta, {
                other: true
            }]);

        });

        it('throws when meta is missing', () => {

            expect(() => Joi.any().meta()).to.throw('Meta cannot be undefined');
        });
    });

    describe('not()', () => {

        it('validates invalid values', () => {

            Helper.validate(Joi.not(5), [
                [4, true],
                [5, false, null, {
                    message: '"value" contains an invalid value',
                    details: [{
                        message: '"value" contains an invalid value',
                        path: [],
                        type: 'any.invalid',
                        context: { value: 5, invalids: [5], label: 'value' }
                    }]
                }]
            ]);
        });
    });

    describe('note()', () => {

        it('sets notes', () => {

            const b = Joi.any().note('a').note('my notes');
            expect(b.describe().notes).to.equal(['a', 'my notes']);
        });

        it('throws when notes are missing', () => {

            expect(() => Joi.any().note()).to.throw('Missing notes');
        });

        it('throws when notes are invalid', () => {

            expect(() => Joi.any().note(5)).to.throw('Notes must be non-empty strings');
            expect(() => Joi.any().note('')).to.throw('Notes must be non-empty strings');
        });
    });

    describe('only()', () => {

        it('allows only allowed values', () => {

            const schema = Joi.number().allow(1, 'x').only();

            expect(schema.validate(1).error).to.not.exist();
            expect(schema.validate('x').error).to.not.exist();
            expect(schema.validate(2).error).to.be.an.error('"value" must be one of [1, x]');
        });
    });

    describe('optional()', () => {

        it('validates optional with default required', () => {

            const schema = Joi.object({
                a: Joi.any(),
                b: Joi.any(),
                c: {
                    d: Joi.any()
                }
            }).prefs({ presence: 'required' });

            Helper.validate(schema, [
                [{ a: 5 }, false, null, {
                    message: '"b" is required',
                    details: [{
                        message: '"b" is required',
                        path: ['b'],
                        type: 'any.required',
                        context: { label: 'b', key: 'b' }
                    }]
                }],
                [{ a: 5, b: 6 }, false, null, {
                    message: '"c" is required',
                    details: [{
                        message: '"c" is required',
                        path: ['c'],
                        type: 'any.required',
                        context: { label: 'c', key: 'c' }
                    }]
                }],
                [{ a: 5, b: 6, c: {} }, false, null, {
                    message: '"c.d" is required',
                    details: [{
                        message: '"c.d" is required',
                        path: ['c', 'd'],
                        type: 'any.required',
                        context: { label: 'c.d', key: 'd' }
                    }]
                }],
                [{ a: 5, b: 6, c: { d: 7 } }, true],
                [{}, false, null, {
                    message: '"a" is required',
                    details: [{
                        message: '"a" is required',
                        path: ['a'],
                        type: 'any.required',
                        context: { label: 'a', key: 'a' }
                    }]
                }],
                [{ b: 5 }, false, null, {
                    message: '"a" is required',
                    details: [{
                        message: '"a" is required',
                        path: ['a'],
                        type: 'any.required',
                        context: { label: 'a', key: 'a' }
                    }]
                }]
            ]);
        });

        it('avoids unnecessary cloning when called twice', () => {

            const schema = Joi.any().optional();
            expect(schema.optional()).to.shallow.equal(schema);
        });
    });

    describe('options()', () => {

        it('does not modify provided options', () => {

            const options = { convert: true };
            const schema = Joi.object().prefs(options);
            schema.validate({});
            expect(options).to.equal({ convert: true });

            const options2 = { convert: false };
            schema.validate({}, options2);
            expect(options).to.equal({ convert: true });
            expect(options2).to.equal({ convert: false });
        });

        it('adds to existing options', () => {

            const schema = Joi.object({ b: Joi.number().strict().prefs({ convert: true }) });
            const input = { b: '2' };
            expect(schema.validate(input)).to.equal({ value: { b: 2 } });
        });

        it('throws with an invalid option', () => {

            expect(() => Joi.any().prefs({ foo: 'bar' })).to.throw('"foo" is not allowed');
        });

        it('throws with an invalid option type', () => {

            expect(() => Joi.any().prefs({ convert: 'yes' })).to.throw('"convert" must be a boolean');
        });

        it('throws with an invalid option value', () => {

            expect(() => Joi.any().prefs({ presence: 'yes' })).to.throw('"presence" must be one of [required, optional, forbidden]');
        });

        it('does not throw with multiple options including presence key', () => {

            expect(() => Joi.any().prefs({ presence: 'optional', noDefaults: true })).to.not.throw();
        });

        it('describes a schema with options', () => {

            const schema = Joi.any().prefs({ abortEarly: false, convert: false });
            expect(schema.describe()).to.equal({ type: 'any', preferences: { abortEarly: false, convert: false } });
        });

        it('merges options properly', () => {

            const baseSchema = Joi.any();
            expect(baseSchema.describe().preferences).to.be.undefined();

            const languageSchema = baseSchema.prefs({ messages: { 'type.foo': 'foo' } });
            expect(languageSchema.describe().preferences).to.equal({ messages: { 'type.foo': 'foo' } });

            const normalOptionSchema = baseSchema.prefs({ abortEarly: true });
            expect(normalOptionSchema.describe().preferences).to.equal({ abortEarly: true });

            const normalOptionsOverLanguageSchema = languageSchema.prefs({ abortEarly: true });
            expect(normalOptionsOverLanguageSchema.describe().preferences).to.equal({
                abortEarly: true,
                messages: {
                    'type.foo': 'foo'
                }
            });

            const languageOptionsOverNormalOptionsSchema = normalOptionSchema.prefs({ messages: { 'type.foo': 'foo' } });
            expect(languageOptionsOverNormalOptionsSchema.describe().preferences).to.equal({
                abortEarly: true,
                messages: {
                    'type.foo': 'foo'
                }
            });

            const languageOptionsOverLanguageOptionsSchema = languageSchema.prefs({
                messages: {
                    'type.bar': 'bar',
                    'type2.foo': 'foo'
                }
            });
            expect(languageOptionsOverLanguageOptionsSchema.describe().preferences).to.equal({
                messages: {
                    'type.foo': 'foo',
                    'type.bar': 'bar',
                    'type2.foo': 'foo'
                }
            });
        });
    });

    describe('raw()', () => {

        it('gives the raw input', () => {

            const tests = [
                [Joi.binary(), 'abc'],
                [Joi.boolean(), false],
                [Joi.date(), '1970/01/01'],
                [Joi.number(), '12'],
                [Joi.any().strict(), 'abc']
            ];

            for (const test of tests) {
                const input = test[1];
                const schema = test[0].raw();
                expect(schema.raw().validate(input)).to.equal({ value: input });
            }
        });

        it('cancels raw mode', () => {

            const schema = Joi.number().raw().raw(false);
            expect(schema.validate('123')).to.equal({ value: 123 });
        });

        it('avoids unnecessary cloning when called twice', () => {

            const schema = Joi.any().raw();
            expect(schema.raw()).to.shallow.equal(schema);
        });
    });

    describe('required', () => {

        it('avoids unnecessary cloning when called twice', () => {

            const schema = Joi.any().required();
            expect(schema.required()).to.shallow.equal(schema);
        });
    });

    describe('rule()', () => {

        it('throws on empty ruleset', () => {

            expect(() => Joi.number().min(10).rule({})).to.not.throw();
            expect(() => Joi.number().ruleset.min(10).rule({})).to.not.throw();
            expect(() => Joi.number().$.min(10).rule({})).to.not.throw();
            expect(() => Joi.number().$.min(10).rule({}).max(11).rule({})).to.not.throw();
            expect(() => Joi.string().trim().min(1)._ruleRemove('trim').rule({})).to.not.throw();
            expect(() => Joi.string().trim().$.min(1)._ruleRemove('trim').rule({})).to.not.throw();

            expect(() => Joi.number().ruleset.min(10).concat(Joi.any())).to.throw('Cannot concatenate onto a schema with open ruleset');
            expect(() => Joi.number().concat(Joi.number().min(10)).rule({})).to.throw('Cannot apply rules to empty ruleset');
            expect(() => Joi.number().concat(Joi.number().$.min(10))).to.throw('Cannot concatenate a schema with open ruleset');

            expect(() => Joi.any().ruleset.rule({})).to.throw('Cannot apply rules to empty ruleset');
            expect(() => Joi.any().rule({})).to.throw('Cannot apply rules to empty ruleset');
            expect(() => Joi.number().min(10).rule({}).rule({})).to.throw('Cannot apply rules to empty ruleset');
            expect(() => Joi.string().ruleset.trim()._ruleRemove('trim').rule({})).to.throw('Cannot apply rules to empty ruleset');
            expect(() => Joi.string().trim()._ruleRemove('trim').rule({})).to.throw('Cannot apply rules to empty ruleset');

            expect(() => Joi.number().ruleset.min(10).concat(Joi.any().ruleset).rule({})).to.throw('Cannot concatenate onto a schema with open ruleset');
            expect(() => Joi.number().min(10).concat(Joi.number().$.max(11).rule({})).rule({})).to.throw('Cannot apply rules to empty ruleset');

            expect(() => Joi.string().insensitive().rule({})).to.throw('Cannot apply rules to empty ruleset');
            expect(() => Joi.string().lowercase().insensitive().rule({})).to.throw('Cannot apply rules to empty ruleset');
            expect(() => Joi.string().$.lowercase().insensitive()).to.throw('Cannot set flag inside a ruleset');
        });

        describe('keep', () => {

            it('retains both unique rule instances', () => {

                const schema = Joi.number()
                    .min(10).rule({ message: 'way too small', keep: true })
                    .min(100).message('still too small');

                expect(schema.validate(1).error).to.be.an.error('way too small');
                expect(schema.validate(90).error).to.be.an.error('still too small');
            });
        });

        describe('message', () => {

            it('overrides message', () => {

                expect(Joi.number().min(10).rule({ message: 'way too small' }).validate(1).error).to.be.an.error('way too small');
                expect(Joi.number().min(10).rule({ message: { 'number.min': 'way too small' } }).validate(1).error).to.be.an.error('way too small');
                expect(Joi.number().min(10).rule({ message: { 'number.max': 'way too big' } }).validate(1).error).to.be.an.error('"value" must be larger than or equal to 10');
            });

            it('overrides ruleset with single message', () => {

                const schema = Joi.number().$.max(100).min(10).rule({ message: 'number out of bound' });
                expect(schema.validate(1).error).to.be.an.error('number out of bound');
                expect(schema.validate(101).error).to.be.an.error('number out of bound');
            });

            it('overrides ruleset messages', () => {

                const schema = Joi.number().$.max(100).min(10).rule({ message: { 'number.max': 'way too big', 'number.min': 'way too small' } });
                expect(schema.validate(1).error).to.be.an.error('way too small');
                expect(schema.validate(101).error).to.be.an.error('way too big');
            });

            it('overrides template', () => {

                expect(Joi.number().min(10).rule({ message: '{{#label}} way too small' }).validate(1).error).to.be.an.error('value way too small');
                expect(Joi.number().min(10).rule({ message: { 'number.min': '{{#label}} way too small' } }).validate(1).error).to.be.an.error('value way too small');
                expect(Joi.number().min(10).rule({ message: { 'number.max': '{{#label}} way too big' } }).validate(1).error).to.be.an.error('"value" must be larger than or equal to 10');
            });

            it('overrides ruleset with single template', () => {

                const schema = Joi.number().$.max(100).min(10).rule({ message: '{{#label}} number out of bound' });
                expect(schema.validate(1).error).to.be.an.error('value number out of bound');
                expect(schema.validate(101).error).to.be.an.error('value number out of bound');
            });

            it('overrides ruleset templates', () => {

                const schema = Joi.number().$.max(100).min(10).rule({ message: { 'number.max': '{{#label}} way too big', 'number.min': '{{#label}} way too small' } });
                expect(schema.validate(1).error).to.be.an.error('value way too small');
                expect(schema.validate(101).error).to.be.an.error('value way too big');
            });

            it('overrides ruleset with both message and template', () => {

                const schema = Joi.number().$.max(100).min(10).rule({ message: { 'number.max': 'way too big', 'number.min': '{{#label}} way too small' } });
                expect(schema.validate(1).error).to.be.an.error('value way too small');
                expect(schema.validate(101).error).to.be.an.error('way too big');
            });
        });
    });

    describe('strict()', () => {

        it('validates without converting', () => {

            const schema = Joi.object({
                array: Joi.array().items(Joi.string().min(5), Joi.number().min(3))
            }).strict();

            Helper.validate(schema, [
                [{ array: ['12345'] }, true],
                [{ array: ['1'] }, false, null, {
                    message: '"array[0]" does not match any of the allowed types',
                    details: [{
                        message: '"array[0]" does not match any of the allowed types',
                        path: ['array', 0],
                        type: 'array.includes',
                        context: { pos: 0, value: '1', label: 'array[0]', key: 0 }
                    }]
                }],
                [{ array: [3] }, true],
                [{ array: ['12345', 3] }, true],
                [{ array: ['3'] }, false, null, {
                    message: '"array[0]" does not match any of the allowed types',
                    details: [{
                        message: '"array[0]" does not match any of the allowed types',
                        path: ['array', 0],
                        type: 'array.includes',
                        context: { pos: 0, value: '3', label: 'array[0]', key: 0 }
                    }]

                }],
                [{ array: [1] }, false, null, {
                    message: '"array[0]" does not match any of the allowed types',
                    details: [{
                        message: '"array[0]" does not match any of the allowed types',
                        path: ['array', 0],
                        type: 'array.includes',
                        context: { pos: 0, value: 1, label: 'array[0]', key: 0 }
                    }]

                }]
            ]);
        });

        it('can be disabled', () => {

            const schema = Joi.object({
                array: Joi.array().items(Joi.string().min(5), Joi.number().min(3))
            }).strict().strict(false);

            Helper.validate(schema, [
                [{ array: ['12345'] }, true],
                [{ array: ['1'] }, false, null, {
                    message: '"array[0]" does not match any of the allowed types',
                    details: [{
                        message: '"array[0]" does not match any of the allowed types',
                        path: ['array', 0],
                        type: 'array.includes',
                        context: { pos: 0, value: '1', label: 'array[0]', key: 0 }
                    }]
                }],
                [{ array: [3] }, true],
                [{ array: ['12345', 3] }, true],
                [{ array: ['3'] }, true],
                [{ array: [1] }, false, null, {
                    message: '"array[0]" does not match any of the allowed types',
                    details: [{
                        message: '"array[0]" does not match any of the allowed types',
                        path: ['array', 0],
                        type: 'array.includes',
                        context: { pos: 0, value: 1, label: 'array[0]', key: 0 }
                    }]
                }]
            ]);
        });

        it('adds to existing options', () => {

            const schema = Joi.object({ b: Joi.number().prefs({ convert: true }).strict() });
            const input = { b: '2' };
            const err = schema.validate(input).error;
            expect(err.message).to.equal('"b" must be a number');
            expect(err.details).to.equal([{
                message: '"b" must be a number',
                path: ['b'],
                type: 'number.base',
                context: { label: 'b', key: 'b', value: '2' }
            }]);
        });
    });

    describe('strip()', () => {

        it('validates and returns undefined', () => {

            const schema = Joi.string().strip();
            expect(schema.validate('test')).to.equal({ value: undefined });
        });

        it('validates and returns an error', () => {

            const schema = Joi.string().strip();

            const err = schema.validate(1).error;
            expect(err.message).to.equal('"value" must be a string');
            expect(err.details).to.equal([{
                message: '"value" must be a string',
                path: [],
                type: 'string.base',
                context: { value: 1, label: 'value' }
            }]);
        });

        it('avoids unnecessary cloning when called twice', () => {

            const schema = Joi.any().strip();
            expect(schema.strip()).to.shallow.equal(schema);
        });

        it('cancels strip', () => {

            const schema = Joi.any().strip().strip(false);
            expect(schema._flags.result).to.not.exist();
        });
    });

    describe('tag()', () => {

        it('sets the tags', () => {

            const b = Joi.any().tag('tag1', 'tag2').tag('tag3');
            expect(b.describe().tags).to.include('tag1');
            expect(b.describe().tags).to.include('tag2');
            expect(b.describe().tags).to.include('tag3');
        });

        it('throws when tags are missing', () => {

            expect(() => Joi.any().tag()).to.throw('Missing tags');
        });

        it('throws when tags are invalid', () => {

            expect(() => Joi.any().tag(5)).to.throw('Tags must be non-empty strings');
            expect(() => Joi.any().tag('')).to.throw('Tags must be non-empty strings');
        });
    });

    describe('tailor()', () => {

        it('customizes root schema', () => {

            const alterations = {
                x: (s) => s.min(10),
                y: (s) => s.max(50),
                z: (s) => s.integer()
            };

            const before = Joi.number().alter(alterations);

            const first = before.tailor('x');
            const after1 = Joi.number().min(10).alter(alterations);

            expect(first).to.equal(after1);
            expect(first.describe()).to.equal(after1.describe());

            const second = first.tailor(['y', 'z']);
            const after2 = Joi.number().min(10).max(50).integer().alter(alterations);

            expect(second).to.equal(after2);
        });

        it('customizes root schema (multiple alter calls)', () => {

            const alter1 = {
                x: (s) => s.min(10)
            };

            const alter2 = {
                y: (s) => s.max(50),
                z: (s) => s.integer()
            };

            const before = Joi.number().alter(alter1).alter(alter2);

            const first = before.tailor('x');
            const after1 = Joi.number().min(10).alter(alter1).alter(alter2);

            expect(first).to.equal(after1);
            expect(first.describe()).to.equal(after1.describe());

            const second = first.tailor(['y', 'z']);
            const after2 = Joi.number().min(10).max(50).integer().alter(alter1).alter(alter2);

            expect(second).to.equal(after2);
        });

        it('customizes nested schema', () => {

            const alterations = {
                x: (s) => s.min(10),
                y: (s) => s.max(50)
            };

            const number = Joi.number().alter(alterations);

            const before = Joi.object({
                a: number,
                b: {
                    c: number
                },
                d: Joi.object()
                    .pattern(/.*/, number)
            });

            const tailored = before.tailor(['x', 'y']);

            const numberxy = number.min(10).max(50);
            const after = Joi.object({
                a: numberxy,
                b: {
                    c: numberxy
                },
                d: Joi.object()
                    .pattern(/.*/, numberxy)
            });

            expect(tailored).to.equal(after, { skip: ['_ruleset'] });
            expect(tailored.describe()).to.equal(after.describe());
        });
    });

    describe('unit()', () => {

        it('sets the unit', () => {

            const b = Joi.any().unit('milliseconds');
            expect(b.describe().flags.unit).to.equal('milliseconds');
        });

        it('throws when unit is missing', () => {

            expect(() => Joi.any().unit()).to.throw('Unit name must be a non-empty string');
        });
    });

    describe('valid()', () => {

        it('allows valid values to be set', () => {

            expect(() => {

                Joi.any().valid(true, 1, 'hello', new Date(), Symbol('foo'), () => { }, {});
            }).not.to.throw();
        });

        it('throws when passed undefined', () => {

            expect(() => {

                Joi.any().valid(undefined);
            }).to.throw(Error, 'Cannot call allow/valid/invalid with undefined');
        });

        it('validates differents types of values', () => {

            expect(Joi.valid(1).validate(1).error).to.not.exist();
            expect(Joi.valid(1).validate(2).error).to.exist();

            const d = new Date();
            expect(Joi.valid(d).validate(new Date(d.getTime())).error).to.not.exist();
            expect(Joi.valid(d).validate(new Date(d.getTime() + 1)).error).to.be.an.error(`"value" must be one of [${d.toISOString()}]`);
            expect(Joi.valid(d).validate(new Date(d.getTime() + 1)).error.details).to.equal([{
                message: `"value" must be one of [${d.toISOString()}]`,
                path: [],
                type: 'any.only',
                context: { value: new Date(d.getTime() + 1), valids: [d], label: 'value' }
            }]);
            expect(Joi.valid(Joi.ref('$a')).validate(d, { context: { a: new Date(d.getTime()) } }).error).to.not.exist();
            expect(Joi.object({ a: Joi.date(), b: Joi.valid(Joi.ref('a')) }).validate({ a: d, b: d }).error).to.not.exist();
            expect(Joi.object({ a: Joi.array().items(Joi.date()).single(), b: Joi.valid(Joi.ref('a')) }).validate({ a: d, b: d }).error).to.not.exist();
            expect(Joi.object({ a: Joi.array().items(Joi.date()).single(), b: Joi.valid(Joi.ref('a')) }).validate({ a: new Date(0), b: d }).error).to.be.an.error('"b" must be one of [ref:a]');

            const str = 'foo';
            expect(Joi.valid(str).validate(str).error).to.not.exist();
            expect(Joi.valid(str).validate('foobar').error).to.be.an.error('"value" must be one of [foo]');
            expect(Joi.valid(str).validate('foobar').error.details).to.equal([{
                message: '"value" must be one of [foo]',
                path: [],
                type: 'any.only',
                context: { value: 'foobar', valids: [str], label: 'value' }
            }]);

            const s = Symbol('foo');
            expect(Joi.valid(s).validate(s).error).to.not.exist();
            const otherSymbol = Symbol('foo');
            expect(Joi.valid(s).validate(otherSymbol).error).to.be.an.error('"value" must be one of [Symbol(foo)]');
            expect(Joi.valid(s).validate(otherSymbol).error.details).to.equal([{
                message: '"value" must be one of [Symbol(foo)]',
                path: [],
                type: 'any.only',
                context: { value: otherSymbol, valids: [s], label: 'value' }
            }]);

            const o = {};
            expect(Joi.valid(o).validate(o).error).to.not.exist();
            expect(Joi.valid(o).validate({}).error).to.be.an.error('"value" must be one of [[object Object]]');
            expect(Joi.valid(o).validate({}).error.details).to.equal([{
                message: '"value" must be one of [[object Object]]',
                path: [],
                type: 'any.only',
                context: { value: o, valids: [o], label: 'value' }
            }]);

            const f = () => { };
            expect(Joi.valid(f).validate(f).error).to.not.exist();
            const otherFunction = () => { };
            expect(Joi.valid(f).validate(otherFunction).error).to.be.an.error('"value" must be one of [() => { }]');
            expect(Joi.valid(f).validate(otherFunction).error.details).to.equal([{
                message: '"value" must be one of [() => { }]',
                path: [],
                type: 'any.only',
                context: { value: otherFunction, valids: [f], label: 'value' }
            }]);

            const b = Buffer.from('foo');
            expect(Joi.valid(b).validate(b).error).to.not.exist();
            expect(Joi.valid(b).validate(Buffer.from('foobar')).error).to.be.an.error('"value" must be one of [foo]');
            expect(Joi.valid(b).validate(Buffer.from('foobar')).error.details).to.equal([{
                message: '"value" must be one of [foo]',
                path: [],
                type: 'any.only',
                context: { value: Buffer.from('foobar'), valids: [b], label: 'value' }
            }]);
        });

        it('preserves passed value when cloned', () => {

            const o = {};
            expect(Joi.valid(o).clone().validate(o).error).to.not.exist();
            expect(Joi.valid(o).clone().validate({}).error).to.be.an.error('"value" must be one of [[object Object]]');
        });

        it('supports templates', () => {

            const schema = Joi.object({
                a: Joi.number(),
                b: Joi.valid(Joi.x('{a + 1}'))
            });

            expect(schema.validate({ a: 5, b: 6 }).error).to.not.exist();
            expect(schema.validate({ a: 5, b: 5 }).error).to.be.an.error('"b" must be one of [{a + 1}]');
        });

        it('supports templates with literals', () => {

            const schema = Joi.object({
                a: Joi.number(),
                b: Joi.valid(Joi.x('x{a + 1}'))
            });

            expect(schema.validate({ a: 5, b: 'x6' }).error).to.not.exist();
            expect(schema.validate({ a: 5, b: 'x5' }).error).to.be.an.error('"b" must be one of [x{a + 1}]');
        });

        it('supports pure literal templates', () => {

            const schema = Joi.object({
                a: Joi.number(),
                b: Joi.valid(Joi.x('x'))
            });

            expect(schema.validate({ a: 5, b: 'x' }).error).to.not.exist();
            expect(schema.validate({ a: 5, b: 'y' }).error).to.be.an.error('"b" must be one of [x]');
        });

        it('supports templates with functions', () => {

            const schema = Joi.object({
                a: Joi.number(),
                b: Joi.boolean(),
                c: Joi.valid(Joi.x('{if(a == 5 && b == true, a * 2, null)}'))
            });

            expect(schema.validate({ a: 5, b: true, c: 10 }).error).to.not.exist();
            expect(schema.validate({ a: 5, b: false, c: null }).error).to.not.exist();
        });
    });

    describe('$_validate()', () => {

        it('checks value after conversion', () => {

            const schema = Joi.number().invalid(2);
            const err = schema.validate('2', { abortEarly: false }).error;
            expect(err).to.be.an.error('"value" contains an invalid value');
            expect(err.details).to.equal([{
                message: '"value" contains an invalid value',
                path: [],
                type: 'any.invalid',
                context: { value: 2, invalids: [2], label: 'value' }
            }]);
        });
    });

    describe('validate()', () => {

        it('accepts only value (sync way)', () => {

            const schema = Joi.number();
            const result = schema.validate('2');
            expect(result).to.contain({ value: 2 });
        });

        it('accepts value and callback', () => {

            const schema = Joi.number();
            expect(schema.validate('2')).to.equal({ value: 2 });
        });

        it('accepts value and options', () => {

            const schema = Joi.number();
            const result = schema.validate('2', { convert: false });
            expect(result.error).to.be.an.error('"value" must be a number');
            expect(result.error.details).to.equal([{
                message: '"value" must be a number',
                path: [],
                type: 'number.base',
                context: { label: 'value', value: '2' }
            }]);
        });

        it('accepts value, options and callback', () => {

            const schema = Joi.number();
            const err = schema.validate('2', { convert: false }).error;
            expect(err).to.be.an.error('"value" must be a number');
            expect(err.details).to.equal([{
                message: '"value" must be a number',
                path: [],
                type: 'number.base',
                context: { label: 'value', value: '2' }
            }]);
        });
    });

    describe('warn', () => {

        it('turns error into warning', () => {

            const schema = Joi.string().min(10).warn();
            const { value, error, warning } = schema.validate('abc');
            expect(value).to.equal('abc');
            expect(error).to.not.exist();
            expect(warning).to.equal({
                message: '"value" length must be at least 10 characters long',
                details: [
                    {
                        message: '"value" length must be at least 10 characters long',
                        path: [],
                        type: 'string.min',
                        context: {
                            encoding: undefined,
                            label: 'value',
                            limit: 10,
                            value: 'abc'
                        }
                    }
                ]
            });
        });
    });

    describe('when()', () => {

        it('throws when options are invalid', () => {

            expect(() => Joi.when('a')).to.throw('Options must be of type object');
        });

        it('validates multiple conditions', () => {

            const schema = Joi.object({
                a: Joi.boolean(),
                b: Joi.boolean(),
                c: Joi.number()
                    .when('a', { is: true, then: Joi.number().max(100) })
                    .when('b', { is: true, then: Joi.number().min(10) })
            });

            Helper.validate(schema, [
                [{ c: 0 }, true],
                [{ c: 10 }, true],
                [{ c: 100 }, true],
                [{ c: 50 }, true],
                [{ c: 101 }, true],
                [{ a: true, c: 0 }, true],
                [{ a: true, c: 100 }, true],
                [{ a: true, c: 101 }, false, null, {
                    message: '"c" must be less than or equal to 100',
                    details: [{
                        message: '"c" must be less than or equal to 100',
                        path: ['c'],
                        type: 'number.max',
                        context: { value: 101, label: 'c', key: 'c', limit: 100 }
                    }]
                }],
                [{ b: true, c: 10 }, true],
                [{ b: true, c: 50 }, true],
                [{ b: true, c: 101 }, true],
                [{ b: true, c: 0 }, false, null, {
                    message: '"c" must be larger than or equal to 10',
                    details: [{
                        message: '"c" must be larger than or equal to 10',
                        path: ['c'],
                        type: 'number.min',
                        context: { value: 0, label: 'c', key: 'c', limit: 10 }
                    }]
                }],
                [{ a: true, b: true, c: 10 }, true],
                [{ a: true, b: true, c: 100 }, true],
                [{ a: true, b: true, c: 50 }, true],
                [{ a: true, b: true, c: 0 }, false, null, {
                    message: '"c" must be larger than or equal to 10',
                    details: [{
                        message: '"c" must be larger than or equal to 10',
                        path: ['c'],
                        type: 'number.min',
                        context: { value: 0, label: 'c', key: 'c', limit: 10 }
                    }]
                }],
                [{ a: true, b: true, c: 101 }, false, null, {
                    message: '"c" must be less than or equal to 100',
                    details: [{
                        message: '"c" must be less than or equal to 100',
                        path: ['c'],
                        type: 'number.max',
                        context: { value: 101, label: 'c', key: 'c', limit: 100 }
                    }]
                }]
            ]);
        });

        it('validates multiple conditions (implicit valids)', () => {

            const schema = Joi.object({
                a: Joi.boolean(),
                b: Joi.boolean(),
                c: Joi.number()
                    .when('a', { is: true, then: 1 })
                    .when('b', { is: true, then: 2 })
            });

            Helper.validate(schema, [
                [{ c: 0 }, true],
                [{ c: 1 }, true],
                [{ c: 2 }, true],
                [{ a: true, c: 1 }, true],
                [{ a: true, c: 2 }, false, null, {
                    message: '"c" must be one of [1]',
                    details: [{
                        message: '"c" must be one of [1]',
                        path: ['c'],
                        type: 'any.only',
                        context: { value: 2, label: 'c', key: 'c', valids: [1] }
                    }]
                }],
                [{ b: true, c: 2 }, true],
                [{ b: true, c: 1 }, false, null, {
                    message: '"c" must be one of [2]',
                    details: [{
                        message: '"c" must be one of [2]',
                        path: ['c'],
                        type: 'any.only',
                        context: { value: 1, label: 'c', key: 'c', valids: [2] }
                    }]
                }],
                [{ a: true, b: true, c: 2 }, true],
                [{ a: true, b: true, c: 1 }, false, null, {
                    message: '"c" must be one of [2]',
                    details: [{
                        message: '"c" must be one of [2]',
                        path: ['c'],
                        type: 'any.only',
                        context: { value: 1, label: 'c', key: 'c', valids: [2] }
                    }]
                }]
            ]);
        });

        it('supports not', () => {

            const schema = Joi.object({
                a: Joi.boolean(),
                b: Joi.boolean(),
                c: Joi.number()
                    .when('a', { not: false, then: 1 })
                    .when('b', { not: false, then: 2 })
            });

            Helper.validate(schema, [
                [{ c: 0 }, true],
                [{ c: 1 }, true],
                [{ c: 2 }, true],
                [{ a: true, c: 1 }, true],
                [{ a: true, c: 2 }, false, null, {
                    message: '"c" must be one of [1]',
                    details: [{
                        message: '"c" must be one of [1]',
                        path: ['c'],
                        type: 'any.only',
                        context: { value: 2, label: 'c', key: 'c', valids: [1] }
                    }]
                }],
                [{ b: true, c: 2 }, true],
                [{ b: true, c: 1 }, false, null, {
                    message: '"c" must be one of [2]',
                    details: [{
                        message: '"c" must be one of [2]',
                        path: ['c'],
                        type: 'any.only',
                        context: { value: 1, label: 'c', key: 'c', valids: [2] }
                    }]
                }],
                [{ a: true, b: true, c: 2 }, true],
                [{ a: true, b: true, c: 1 }, false, null, {
                    message: '"c" must be one of [2]',
                    details: [{
                        message: '"c" must be one of [2]',
                        path: ['c'],
                        type: 'any.only',
                        context: { value: 1, label: 'c', key: 'c', valids: [2] }
                    }]
                }]
            ]);
        });

        it('defaults is to truthy', () => {

            const schema = Joi.object({
                a: Joi.any(),
                b: Joi.number()
                    .when('a', { then: 1, otherwise: 2 })
            });

            Helper.validate(schema, [
                [{ b: 2 }, true],
                [{ a: 1, b: 1 }, true],
                [{ b: 1 }, false, null, {
                    message: '"b" must be one of [2]',
                    details: [{
                        message: '"b" must be one of [2]',
                        path: ['b'],
                        type: 'any.only',
                        context: { value: 1, label: 'b', key: 'b', valids: [2] }
                    }]
                }],
                [{ a: 0, b: 1 }, false, null, {
                    message: '"b" must be one of [2]',
                    details: [{
                        message: '"b" must be one of [2]',
                        path: ['b'],
                        type: 'any.only',
                        context: { value: 1, label: 'b', key: 'b', valids: [2] }
                    }]
                }],
                [{ a: '', b: 1 }, false, null, {
                    message: '"b" must be one of [2]',
                    details: [{
                        message: '"b" must be one of [2]',
                        path: ['b'],
                        type: 'any.only',
                        context: { value: 1, label: 'b', key: 'b', valids: [2] }
                    }]
                }],
                [{ a: false, b: 1 }, false, null, {
                    message: '"b" must be one of [2]',
                    details: [{
                        message: '"b" must be one of [2]',
                        path: ['b'],
                        type: 'any.only',
                        context: { value: 1, label: 'b', key: 'b', valids: [2] }
                    }]
                }],
                [{ a: null, b: 1 }, false, null, {
                    message: '"b" must be one of [2]',
                    details: [{
                        message: '"b" must be one of [2]',
                        path: ['b'],
                        type: 'any.only',
                        context: { value: 1, label: 'b', key: 'b', valids: [2] }
                    }]
                }]
            ]);
        });

        it('sets type whens', () => {

            const schema = Joi.object({
                a: Joi.any(),
                b: Joi.string().valid('x').when('a', { is: 5, then: Joi.valid('y'), otherwise: Joi.valid('z') })
            });

            Helper.validate(schema, [
                [{ a: 5, b: 'x' }, true],
                [{ a: 5, b: 'y' }, true],
                [{ a: 5, b: 'z' }, false, null, {
                    message: '"b" must be one of [x, y]',
                    details: [{
                        message: '"b" must be one of [x, y]',
                        path: ['b'],
                        type: 'any.only',
                        context: { value: 'z', valids: ['x', 'y'], label: 'b', key: 'b' }
                    }]
                }],
                [{ a: 1, b: 'x' }, true],
                [{ a: 1, b: 'y' }, false, null, {
                    message: '"b" must be one of [x, z]',
                    details: [{
                        message: '"b" must be one of [x, z]',
                        path: ['b'],
                        type: 'any.only',
                        context: { value: 'y', valids: ['x', 'z'], label: 'b', key: 'b' }
                    }]
                }],
                [{ a: 1, b: 'z' }, true],
                [{ a: 5, b: 'a' }, false, null, {
                    message: '"b" must be one of [x, y]',
                    details: [{
                        message: '"b" must be one of [x, y]',
                        path: ['b'],
                        type: 'any.only',
                        context: { value: 'a', valids: ['x', 'y'], label: 'b', key: 'b' }
                    }]
                }],
                [{ b: 'a' }, false, null, {
                    message: '"b" must be one of [x, z]',
                    details: [{
                        message: '"b" must be one of [x, z]',
                        path: ['b'],
                        type: 'any.only',
                        context: { value: 'a', valids: ['x', 'z'], label: 'b', key: 'b' }
                    }]
                }]
            ]);
        });

        it('sets type whens (only then)', () => {

            const schema = Joi.object({
                a: Joi.any(),
                b: Joi.string().valid('x').when('a', { is: 5, then: Joi.valid('y') })
            });

            Helper.validate(schema, [
                [{ a: 5, b: 'x' }, true],
                [{ a: 5, b: 'y' }, true],
                [{ a: 5, b: 'z' }, false, null, {
                    message: '"b" must be one of [x, y]',
                    details: [{
                        message: '"b" must be one of [x, y]',
                        path: ['b'],
                        type: 'any.only',
                        context: { value: 'z', valids: ['x', 'y'], label: 'b', key: 'b' }
                    }]
                }],
                [{ a: 1, b: 'x' }, true],
                [{ a: 1, b: 'y' }, false, null, {
                    message: '"b" must be one of [x]',
                    details: [{
                        message: '"b" must be one of [x]',
                        path: ['b'],
                        type: 'any.only',
                        context: { value: 'y', valids: ['x'], label: 'b', key: 'b' }
                    }]
                }],
                [{ a: 1, b: 'z' }, false, null, {
                    message: '"b" must be one of [x]',
                    details: [{
                        message: '"b" must be one of [x]',
                        path: ['b'],
                        type: 'any.only',
                        context: { value: 'z', valids: ['x'], label: 'b', key: 'b' }
                    }]
                }],
                [{ a: 5, b: 'a' }, false, null, {
                    message: '"b" must be one of [x, y]',
                    details: [{
                        message: '"b" must be one of [x, y]',
                        path: ['b'],
                        type: 'any.only',
                        context: { value: 'a', valids: ['x', 'y'], label: 'b', key: 'b' }
                    }]
                }],
                [{ b: 'a' }, false, null, {
                    message: '"b" must be one of [x]',
                    details: [{
                        message: '"b" must be one of [x]',
                        path: ['b'],
                        type: 'any.only',
                        context: { value: 'a', valids: ['x'], label: 'b', key: 'b' }
                    }]
                }]
            ]);
        });

        it('sets type whens (only otherwise)', () => {

            const schema = Joi.object({
                a: Joi.any(),
                b: Joi.string().valid('x').when('a', { is: 5, otherwise: Joi.valid('z') })
            });

            Helper.validate(schema, [
                [{ a: 5, b: 'x' }, true],
                [{ a: 5, b: 'y' }, false, null, {
                    message: '"b" must be one of [x]',
                    details: [{
                        message: '"b" must be one of [x]',
                        path: ['b'],
                        type: 'any.only',
                        context: { value: 'y', valids: ['x'], label: 'b', key: 'b' }
                    }]
                }],
                [{ a: 5, b: 'z' }, false, null, {
                    message: '"b" must be one of [x]',
                    details: [{
                        message: '"b" must be one of [x]',
                        path: ['b'],
                        type: 'any.only',
                        context: { value: 'z', valids: ['x'], label: 'b', key: 'b' }
                    }]
                }],
                [{ a: 1, b: 'x' }, true],
                [{ a: 1, b: 'y' }, false, null, {
                    message: '"b" must be one of [x, z]',
                    details: [{
                        message: '"b" must be one of [x, z]',
                        path: ['b'],
                        type: 'any.only',
                        context: { value: 'y', valids: ['x', 'z'], label: 'b', key: 'b' }
                    }]
                }],
                [{ a: 1, b: 'z' }, true],
                [{ a: 5, b: 'a' }, false, null, {
                    message: '"b" must be one of [x]',
                    details: [{
                        message: '"b" must be one of [x]',
                        path: ['b'],
                        type: 'any.only',
                        context: { value: 'a', valids: ['x'], label: 'b', key: 'b' }
                    }]
                }],
                [{ b: 'a' }, false, null, {
                    message: '"b" must be one of [x, z]',
                    details: [{
                        message: '"b" must be one of [x, z]',
                        path: ['b'],
                        type: 'any.only',
                        context: { value: 'a', valids: ['x', 'z'], label: 'b', key: 'b' }
                    }]
                }]
            ]);
        });

        it('sets type whens (with is as a schema)', () => {

            const schema = Joi.object({
                a: Joi.any(),
                b: Joi.string().valid('x').when('a', { is: Joi.number().valid(5).required(), then: Joi.valid('y') })
            });

            Helper.validate(schema, [
                [{ a: 5, b: 'x' }, true],
                [{ a: 5, b: 'y' }, true],
                [{ a: 5, b: 'z' }, false, null, {
                    message: '"b" must be one of [x, y]',
                    details: [{
                        message: '"b" must be one of [x, y]',
                        path: ['b'],
                        type: 'any.only',
                        context: { value: 'z', valids: ['x', 'y'], label: 'b', key: 'b' }
                    }]
                }],
                [{ a: 1, b: 'x' }, true],
                [{ a: 1, b: 'y' }, false, null, {
                    message: '"b" must be one of [x]',
                    details: [{
                        message: '"b" must be one of [x]',
                        path: ['b'],
                        type: 'any.only',
                        context: { value: 'y', valids: ['x'], label: 'b', key: 'b' }
                    }]
                }],
                [{ a: 1, b: 'z' }, false, null, {
                    message: '"b" must be one of [x]',
                    details: [{
                        message: '"b" must be one of [x]',
                        path: ['b'],
                        type: 'any.only',
                        context: { value: 'z', valids: ['x'], label: 'b', key: 'b' }
                    }]
                }],
                [{ a: 5, b: 'a' }, false, null, {
                    message: '"b" must be one of [x, y]',
                    details: [{
                        message: '"b" must be one of [x, y]',
                        path: ['b'],
                        type: 'any.only',
                        context: { value: 'a', valids: ['x', 'y'], label: 'b', key: 'b' }
                    }]
                }],
                [{ b: 'a' }, false, null, {
                    message: '"b" must be one of [x]',
                    details: [{
                        message: '"b" must be one of [x]',
                        path: ['b'],
                        type: 'any.only',
                        context: { value: 'a', valids: ['x'], label: 'b', key: 'b' }
                    }]
                }]
            ]);
        });

        it('makes peer required', () => {

            const schema = Joi.object({
                a: Joi.when('b', { is: 5, then: Joi.required() }),
                b: Joi.any()
            });

            Helper.validate(schema, [
                [{ b: 5 }, false, null, {
                    message: '"a" is required',
                    details: [{
                        message: '"a" is required',
                        path: ['a'],
                        type: 'any.required',
                        context: { label: 'a', key: 'a' }
                    }]
                }],
                [{ b: 6 }, true],
                [{ a: 'b' }, true],
                [{ b: 5, a: 'x' }, true]
            ]);
        });

        it('makes peer required (is ref)', () => {

            const schema = Joi.object({
                a: Joi.when('b', { is: Joi.ref('c'), then: Joi.required() }),
                b: Joi.any(),
                c: Joi.any()
            });

            Helper.validate(schema, [
                [{ b: 5, c: 5 }, false, null, {
                    message: '"a" is required',
                    details: [{
                        message: '"a" is required',
                        path: ['a'],
                        type: 'any.required',
                        context: { label: 'a', key: 'a' }
                    }]
                }],
                [{ b: 6, c: 5 }, true],
                [{ a: 'b' }, true],
                [{ b: 5, a: 'x' }, true]
            ]);
        });

        it('makes peer required (switch is ref)', () => {

            const schema = Joi.object({
                a: Joi.when('b', [
                    { is: Joi.ref('c'), then: Joi.required() },
                    { is: 10, then: Joi.forbidden() }
                ]),
                b: Joi.any(),
                c: Joi.any()
            });

            Helper.validate(schema, [
                [{ b: 5, c: 5 }, false, null, {
                    message: '"a" is required',
                    details: [{
                        message: '"a" is required',
                        path: ['a'],
                        type: 'any.required',
                        context: { label: 'a', key: 'a' }
                    }]
                }],
                [{ b: 6, c: 5 }, true],
                [{ a: 'b' }, true],
                [{ b: 5, a: 'x' }, true]
            ]);
        });

        it('describes the base schema', () => {

            const schema = Joi.number()
                .min(10)
                .when('a', {
                    is: 5,
                    then: Joi.number().max(20).required()
                });

            expect(schema.describe()).to.equal({
                type: 'number',
                rules: [
                    { args: { limit: 10 }, name: 'min' }
                ],
                whens: [{
                    ref: { path: ['a'] },
                    is: {
                        type: 'any',
                        flags: {
                            only: true,
                            presence: 'required'
                        },
                        allow: [{ override: true }, 5]
                    },
                    then: {
                        type: 'number',
                        flags: {
                            presence: 'required'
                        },
                        rules: [{ name: 'max', args: { limit: 20 } }]
                    }
                }]
            });
        });

        it('can describe as the original object (with a schema as a condition)', () => {

            const schema = Joi.number()
                .min(10)
                .when(Joi.number().min(5), { then: Joi.number().max(20).required() });

            expect(schema.describe()).to.equal({
                type: 'number',
                rules: [{ args: { limit: 10 }, name: 'min' }],
                whens: [{
                    is: {
                        type: 'number',
                        rules: [{ name: 'min', args: { limit: 5 } }]
                    },
                    then: {
                        type: 'number',
                        flags: { presence: 'required' },
                        rules: [{ name: 'max', args: { limit: 20 } }]
                    }
                }]
            });
        });

        it('sets value based on multiple conditions', () => {

            const schema = Joi.object({
                a: Joi.number().required(),
                b: Joi.number()
                    .when('a', [
                        { is: 0, then: Joi.valid(1) },
                        { is: 1, then: Joi.valid(2) },
                        { is: 2, then: Joi.valid(3) }
                    ])
            });

            Helper.validate(schema, [
                [{ a: 0, b: 1 }, true],
                [{ a: 0, b: 2 }, false, null, {
                    message: '"b" must be one of [1]',
                    details: [{
                        message: '"b" must be one of [1]',
                        path: ['b'],
                        type: 'any.only',
                        context: { value: 2, valids: [1], label: 'b', key: 'b' }
                    }]
                }],
                [{ a: 1, b: 2 }, true],
                [{ a: 1, b: 3 }, false, null, {
                    message: '"b" must be one of [2]',
                    details: [{
                        message: '"b" must be one of [2]',
                        path: ['b'],
                        type: 'any.only',
                        context: { value: 3, valids: [2], label: 'b', key: 'b' }
                    }]
                }],
                [{ a: 2, b: 3 }, true],
                [{ a: 2, b: 4 }, false, null, {
                    message: '"b" must be one of [3]',
                    details: [{
                        message: '"b" must be one of [3]',
                        path: ['b'],
                        type: 'any.only',
                        context: { value: 4, valids: [3], label: 'b', key: 'b' }
                    }]
                }],
                [{ a: 42, b: 128 }, true]
            ]);
        });

        it('sets value based on multiple conditions with otherwise', () => {

            const schema = Joi.object({
                a: Joi.number().required(),
                b: Joi.number()
                    .when('a', {
                        switch: [
                            { is: 0, then: Joi.valid(1) },
                            { is: 1, then: Joi.valid(2) },
                            { is: 2, then: Joi.valid(3) }
                        ],
                        otherwise: Joi.valid(4)
                    })
            });

            Helper.validate(schema, [
                [{ a: 0, b: 1 }, true],
                [{ a: 0, b: 2 }, false, null, {
                    message: '"b" must be one of [1]',
                    details: [{
                        message: '"b" must be one of [1]',
                        path: ['b'],
                        type: 'any.only',
                        context: { value: 2, valids: [1], label: 'b', key: 'b' }
                    }]
                }],
                [{ a: 1, b: 2 }, true],
                [{ a: 1, b: 3 }, false, null, {
                    message: '"b" must be one of [2]',
                    details: [{
                        message: '"b" must be one of [2]',
                        path: ['b'],
                        type: 'any.only',
                        context: { value: 3, valids: [2], label: 'b', key: 'b' }
                    }]
                }],
                [{ a: 2, b: 3 }, true],
                [{ a: 2, b: 2 }, false, null, {
                    message: '"b" must be one of [3]',
                    details: [{
                        message: '"b" must be one of [3]',
                        path: ['b'],
                        type: 'any.only',
                        context: { value: 2, valids: [3], label: 'b', key: 'b' }
                    }]
                }],
                [{ a: 42, b: 4 }, true],
                [{ a: 42, b: 128 }, false, null, {
                    message: '"b" must be one of [4]',
                    details: [{
                        message: '"b" must be one of [4]',
                        path: ['b'],
                        type: 'any.only',
                        context: { value: 128, valids: [4], label: 'b', key: 'b' }
                    }]
                }]
            ]);
        });

        it('sets value based on multiple conditions with otherwise (short)', () => {

            const schema = Joi.object({
                a: Joi.number().required(),
                b: Joi.number()
                    .when('a', [
                        { is: 0, then: 1 },
                        { is: 1, then: 2 },
                        { is: 2, then: 3, otherwise: 4 }
                    ])
            });

            Helper.validate(schema, [
                [{ a: 0, b: 1 }, true],
                [{ a: 0, b: 2 }, false, null, {
                    message: '"b" must be one of [1]',
                    details: [{
                        message: '"b" must be one of [1]',
                        path: ['b'],
                        type: 'any.only',
                        context: { value: 2, valids: [1], label: 'b', key: 'b' }
                    }]
                }],
                [{ a: 1, b: 2 }, true],
                [{ a: 1, b: 3 }, false, null, {
                    message: '"b" must be one of [2]',
                    details: [{
                        message: '"b" must be one of [2]',
                        path: ['b'],
                        type: 'any.only',
                        context: { value: 3, valids: [2], label: 'b', key: 'b' }
                    }]
                }],
                [{ a: 2, b: 3 }, true],
                [{ a: 2, b: 2 }, false, null, {
                    message: '"b" must be one of [3]',
                    details: [{
                        message: '"b" must be one of [3]',
                        path: ['b'],
                        type: 'any.only',
                        context: { value: 2, valids: [3], label: 'b', key: 'b' }
                    }]
                }],
                [{ a: 42, b: 4 }, true],
                [{ a: 42, b: 128 }, false, null, {
                    message: '"b" must be one of [4]',
                    details: [{
                        message: '"b" must be one of [4]',
                        path: ['b'],
                        type: 'any.only',
                        context: { value: 128, valids: [4], label: 'b', key: 'b' }
                    }]
                }]
            ]);
        });

        it('sets value based on multiple conditions (with base rules)', () => {

            const schema = Joi.object({
                a: Joi.number().required(),
                b: Joi.number().valid(10)
                    .when('a', [
                        { is: 0, then: Joi.valid(1) },
                        { is: 1, then: Joi.valid(2) },
                        { is: 2, then: Joi.valid(3) }
                    ])
            });

            Helper.validate(schema, [
                [{ a: 0, b: 1 }, true],
                [{ a: 0, b: 2 }, false, null, {
                    message: '"b" must be one of [10, 1]',
                    details: [{
                        message: '"b" must be one of [10, 1]',
                        path: ['b'],
                        type: 'any.only',
                        context: { value: 2, valids: [10, 1], label: 'b', key: 'b' }
                    }]
                }],
                [{ a: 0, b: 10 }, true],
                [{ a: 1, b: 2 }, true],
                [{ a: 1, b: 3 }, false, null, {
                    message: '"b" must be one of [10, 2]',
                    details: [{
                        message: '"b" must be one of [10, 2]',
                        path: ['b'],
                        type: 'any.only',
                        context: { value: 3, valids: [10, 2], label: 'b', key: 'b' }
                    }]
                }],
                [{ a: 1, b: 10 }, true],
                [{ a: 2, b: 3 }, true],
                [{ a: 2, b: 4 }, false, null, {
                    message: '"b" must be one of [10, 3]',
                    details: [{
                        message: '"b" must be one of [10, 3]',
                        path: ['b'],
                        type: 'any.only',
                        context: { value: 4, valids: [10, 3], label: 'b', key: 'b' }
                    }]
                }],
                [{ a: 2, b: 10 }, true],
                [{ a: 42, b: 128 }, false, null, {
                    message: '"b" must be one of [10]',
                    details: [{
                        message: '"b" must be one of [10]',
                        path: ['b'],
                        type: 'any.only',
                        context: { value: 128, valids: [10], label: 'b', key: 'b' }
                    }]
                }],
                [{ a: 42, b: 10 }, true]
            ]);
        });

        it('validates conditional whens (self reference, explicit)', () => {

            const schema = Joi.object({
                a: Joi.boolean().required()
            })
                .when(Joi.ref('a', { ancestor: 0 }), {
                    is: true,
                    then: {
                        b: Joi.string().required()
                    },
                    otherwise: {
                        c: Joi.string().required()
                    }
                });

            Helper.validate(schema, [
                [{ a: true, b: 'x' }, true],
                [{ a: true, b: 5 }, false, null, {
                    message: '"b" must be a string',
                    details: [{
                        message: '"b" must be a string',
                        path: ['b'],
                        type: 'string.base',
                        context: { value: 5, key: 'b', label: 'b' }
                    }]
                }],
                [{ a: true }, false, null, {
                    message: '"b" is required',
                    details: [{
                        message: '"b" is required',
                        path: ['b'],
                        type: 'any.required',
                        context: { key: 'b', label: 'b' }
                    }]
                }],
                [{ a: true, c: 5 }, false, null, {
                    message: '"b" is required',
                    details: [{
                        message: '"b" is required',
                        path: ['b'],
                        type: 'any.required',
                        context: { key: 'b', label: 'b' }
                    }]
                }],
                [{ a: true, c: 'x' }, false, null, {
                    message: '"b" is required',
                    details: [{
                        message: '"b" is required',
                        path: ['b'],
                        type: 'any.required',
                        context: { key: 'b', label: 'b' }
                    }]
                }],

                [{ a: false, b: 'x' }, false, null, {
                    message: '"c" is required',
                    details: [{
                        message: '"c" is required',
                        path: ['c'],
                        type: 'any.required',
                        context: { key: 'c', label: 'c' }
                    }]
                }],
                [{ a: false, b: 5 }, false, null, {
                    message: '"c" is required',
                    details: [{
                        message: '"c" is required',
                        path: ['c'],
                        type: 'any.required',
                        context: { key: 'c', label: 'c' }
                    }]
                }],
                [{ a: false }, false, null, {
                    message: '"c" is required',
                    details: [{
                        message: '"c" is required',
                        path: ['c'],
                        type: 'any.required',
                        context: { key: 'c', label: 'c' }
                    }]
                }],
                [{ a: false, c: 5 }, false, null, {
                    message: '"c" must be a string',
                    details: [{
                        message: '"c" must be a string',
                        path: ['c'],
                        type: 'string.base',
                        context: { value: 5, key: 'c', label: 'c' }
                    }]
                }],
                [{ a: false, c: 'x' }, true]
            ]);
        });

        it('validates conditional whens (self reference, implicit)', () => {

            const schema = Joi.object({
                a: Joi.boolean().required()
            })
                .when('.a', {
                    is: true,
                    then: {
                        b: Joi.string().required()
                    },
                    otherwise: {
                        c: Joi.string().required()
                    }
                });

            Helper.validate(schema, [
                [{ a: true, b: 'x' }, true],
                [{ a: true, b: 5 }, false, null, {
                    message: '"b" must be a string',
                    details: [{
                        message: '"b" must be a string',
                        path: ['b'],
                        type: 'string.base',
                        context: { value: 5, key: 'b', label: 'b' }
                    }]
                }],
                [{ a: true }, false, null, {
                    message: '"b" is required',
                    details: [{
                        message: '"b" is required',
                        path: ['b'],
                        type: 'any.required',
                        context: { key: 'b', label: 'b' }
                    }]
                }],
                [{ a: true, c: 5 }, false, null, {
                    message: '"b" is required',
                    details: [{
                        message: '"b" is required',
                        path: ['b'],
                        type: 'any.required',
                        context: { key: 'b', label: 'b' }
                    }]
                }],
                [{ a: true, c: 'x' }, false, null, {
                    message: '"b" is required',
                    details: [{
                        message: '"b" is required',
                        path: ['b'],
                        type: 'any.required',
                        context: { key: 'b', label: 'b' }
                    }]
                }],

                [{ a: false, b: 'x' }, false, null, {
                    message: '"c" is required',
                    details: [{
                        message: '"c" is required',
                        path: ['c'],
                        type: 'any.required',
                        context: { key: 'c', label: 'c' }
                    }]
                }],
                [{ a: false, b: 5 }, false, null, {
                    message: '"c" is required',
                    details: [{
                        message: '"c" is required',
                        path: ['c'],
                        type: 'any.required',
                        context: { key: 'c', label: 'c' }
                    }]
                }],
                [{ a: false }, false, null, {
                    message: '"c" is required',
                    details: [{
                        message: '"c" is required',
                        path: ['c'],
                        type: 'any.required',
                        context: { key: 'c', label: 'c' }
                    }]
                }],
                [{ a: false, c: 5 }, false, null, {
                    message: '"c" must be a string',
                    details: [{
                        message: '"c" must be a string',
                        path: ['c'],
                        type: 'string.base',
                        context: { value: 5, key: 'c', label: 'c' }
                    }]
                }],
                [{ a: false, c: 'x' }, true]
            ]);
        });

        it('validates with nested whens', () => {

            // If ((b === 0 && a === 123) ||
            //     (b !== 0 && a === anything))
            // then c === 456
            // else c === 789

            const schema = Joi.object({
                a: Joi.number().required(),
                b: Joi.number().required(),
                c: Joi.when('a', {
                    is: Joi.when('b', {
                        is: Joi.valid(0),
                        then: Joi.valid(123)
                    }),
                    then: Joi.valid(456),
                    otherwise: Joi.valid(789)
                })
            });

            Helper.validate(schema, [
                [{ a: 123, b: 0, c: 456 }, true],
                [{ a: 0, b: 1, c: 456 }, true],
                [{ a: 0, b: 0, c: 789 }, true],
                [{ a: 123, b: 456, c: 456 }, true],
                [{ a: 0, b: 0, c: 456 }, false, null, {
                    message: '"c" must be one of [789]',
                    details: [{
                        message: '"c" must be one of [789]',
                        path: ['c'],
                        type: 'any.only',
                        context: { value: 456, valids: [789], label: 'c', key: 'c' }
                    }]
                }],
                [{ a: 123, b: 456, c: 789 }, false, null, {
                    message: '"c" must be one of [456]',
                    details: [{
                        message: '"c" must be one of [456]',
                        path: ['c'],
                        type: 'any.only',
                        context: { value: 789, valids: [456], label: 'c', key: 'c' }
                    }]
                }]
            ]);
        });

        it('throws when conditions conflict', () => {

            const schema = Joi.object({
                a: Joi.boolean(),
                b: Joi.boolean(),
                c: Joi.when('a', { is: true, then: Joi.number() }).when('b', { is: true, then: Joi.string() })
            });

            expect(() => schema.validate({ a: true, b: true, c: 'x' })).to.throw('Cannot merge type number with another type: string');
        });

        describe('with schema', () => {

            it('should peek inside a simple value', () => {

                const schema = Joi.number().when(Joi.number().min(0), { then: Joi.number().min(10) });
                Helper.validate(schema, [
                    [-1, true, null, -1],
                    [1, false, null, {
                        message: '"value" must be larger than or equal to 10',
                        details: [{
                            message: '"value" must be larger than or equal to 10',
                            path: [],
                            type: 'number.min',
                            context: { limit: 10, value: 1, label: 'value' }
                        }]
                    }],
                    [10, true, null, 10]
                ]);
            });

            it('should peek inside an object', () => {

                const schema = Joi.object().keys({
                    foo: Joi.string(),
                    bar: Joi.number()
                })
                    .when(Joi.object().keys({ foo: Joi.valid('hasBar').required() }).unknown(), {
                        then: Joi.object().keys({ bar: Joi.required() })
                    });

                Helper.validate(schema, [
                    [{ foo: 'whatever' }, true, null, { foo: 'whatever' }],
                    [{ foo: 'hasBar' }, false, null, {
                        message: '"bar" is required',
                        details: [{
                            message: '"bar" is required',
                            path: ['bar'],
                            type: 'any.required',
                            context: { key: 'bar', label: 'bar' }
                        }]
                    }],
                    [{ foo: 'hasBar', bar: 42 }, true, null, { foo: 'hasBar', bar: 42 }],
                    [{}, true, null, {}]
                ]);
            });
        });
    });

    describe('_rule()', () => {

        it('errors on invalid options', () => {

            expect(() => Joi.any().$_addRule()).to.throw('Invalid options');
            expect(() => Joi.any().$_addRule(5)).to.throw('Invalid options');
            expect(() => Joi.any().$_addRule({})).to.throw('Invalid rule name');
            expect(() => Joi.any().$_addRule('')).to.throw('Invalid rule name');
            expect(() => Joi.any().$_addRule({ name: '' })).to.throw('Invalid rule name');
            expect(() => Joi.any().$_addRule({ name: 5 })).to.throw('Invalid rule name');
        });
    });
});
