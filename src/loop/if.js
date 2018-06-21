import { generate } from 'escodegen'
import { parseExpression } from '@babel/parser'
import { getNextNum } from '../function/case'
import { createNewCase, getNextStep } from '../utils/syntaxTree'
import * as t from 'babel-types'

/**
 *
 * @param param0
 */
export function astIf({ caseLen, switchCase, firstStatement, varNames, switchStatement }) {
  // create a new Case
  let newCase = createNewCase(varNames[0], caseLen + 1, 0)
  if (firstStatement.consequent.type === 'BlockStatement' && firstStatement.consequent.body) {
    // block
    firstStatement.consequent.body.push(getNextStep(varNames[0], getNextNum(switchCase)))
    firstStatement.consequent.body.push(t.breakStatement())
    newCase.consequent = firstStatement.consequent.body
  } else {
    // not block
    newCase.consequent = [
      firstStatement.consequent,
      getNextStep(varNames[0], getNextNum(switchCase)),
      t.breakStatement(),
    ]
  }
  switchStatement.cases.push(newCase)

  if (firstStatement.alternate) {
    let c = createNewCase(varNames[0], caseLen + 2, 0)
    if (firstStatement.alternate.type === 'BlockStatement' && firstStatement.alternate.body) {
      firstStatement.alternate.body.push(getNextStep(varNames[0], getNextNum(switchCase)))
      firstStatement.alternate.body.push(t.breakStatement())
      c.consequent = firstStatement.alternate.body
    } else {
      c.consequent = [
        firstStatement.alternate,
        getNextStep(varNames[0], getNextNum(switchCase)),
        t.breakStatement(),
      ]
    }
    switchStatement.cases.push(c)
  }

  // transform the original case
  let a = t.expressionStatement(
    parseExpression(
      `${varNames[0]}=${generate(firstStatement.test)}?${caseLen + 1}:${
        firstStatement.alternate
          ? caseLen + 2
          : switchCase.consequent[switchCase.consequent.length - 2].expression.right.value
      }`
    )
  )
  switchCase.consequent = [a, switchCase.consequent[switchCase.consequent.length - 1]]
}
