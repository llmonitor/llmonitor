import {
  Badge,
  Group,
  HoverCard,
  Progress,
  ScrollArea,
  Stack,
  Text,
} from "@mantine/core"
import classes from "./index.module.css"
import { formatCost } from "@/utils/format"
// We create a matrix of results for each prompt, variable and model.
// The matrix is a 3D array, where each dimension represents a different

// type EvalResult = {
//   model: string
//   prompt: string
//   variables: {
//     [key: string]: string
//   }
//   latency: number
//   output: string
//   passed: boolean
// }

function getResultForVariation(
  prompt: string,
  variables: { [key: string]: string },
  model: string,
  evalResults,
): any | undefined {
  return evalResults.find(
    (result) =>
      result.prompt === prompt &&
      result.model === model &&
      Object.keys(variables).every(
        (variable) => result.variables[variable] === variables[variable],
      ),
  )
}

const getAggegateForVariation = (
  prompt: string,
  model: string,
  evalResults,
): {
  passed: number // percentage passed
  failed: number // percentage failed
  duration: number // average duration
  cost: number // average cost
} => {
  const results = evalResults.filter(
    (result) => result.prompt === prompt && result.model === model,
  )

  return {
    passed: results.filter((result) => result.passed).length,
    failed: results.filter((result) => !result.passed).length,
    duration: +(
      results.reduce((acc, result) => acc + parseInt(result.duration), 0) /
      results.length /
      1000
    ).toFixed(2),
    cost:
      results.reduce((acc, result) => acc + result.cost, 0) / results.length,
  }
}

const getVariableVariations = (results) => {
  const variations = results.map((result) => result.variables)
  const uniqueVariations = Array.from(
    new Set(variations.map((variation) => JSON.stringify(variation))),
  ).map((variation) => JSON.parse(variation))
  return uniqueVariations as { [key: string]: string }[]
}

const getPromptModelVariations = (results) => {
  const variations = results.map((result) => ({
    prompt: result.prompt,
    model: result.model,
  }))
  const uniqueVariations = Array.from(
    new Set(variations.map((variation) => JSON.stringify(variation))),
  )
    .map((variation) => JSON.parse(variation))
    .map((variation) => ({
      ...variation,
      ...getAggegateForVariation(variation.prompt, variation.model, results),
    }))

  return uniqueVariations as {
    prompt: string
    model: string
    passed: number
    failed: number
    duration: number
    cost: number
  }[]
}

function ResultDetails({ details }) {
  if (typeof details !== "object") {
    return <Text>Details not available</Text>
  }

  return (
    <Stack>
      {details.map(({ passed, reason, filterId }) => {
        return (
          <Group>
            <Text>{filterId}</Text>
            <Badge color={passed ? "green" : "red"}>
              {passed ? "Passed" : "Failed"}
            </Badge>
            <Text>{reason}</Text>
          </Group>
        )
      })}
    </Stack>
  )
}

export default function ResultsMatrix({ data }) {
  const variableVariations = getVariableVariations(data)

  const pmVariations = getPromptModelVariations(data)

  const variables = Object.keys(variableVariations[0])

  console.log(data)

  return (
    <table className={classes["matrix-table"]}>
      <thead>
        <tr>
          <th colSpan={variables.length}>Variables</th>
          <th colSpan={data.length}>Outputs</th>
        </tr>
        <tr>
          {variables.map((variable) => (
            <th>{variable}</th>
          ))}
          {pmVariations.map(
            ({ model, prompt, passed, failed, duration, cost }, index) => {
              return (
                <th>
                  <Stack align="center" gap="xs">
                    <Badge variant="outline">{model}</Badge>
                    <Progress.Root size={20} w={100}>
                      <Progress.Section
                        value={(passed / (passed + failed)) * 100}
                        color="green"
                      >
                        <Progress.Label>{`${passed}`}</Progress.Label>
                      </Progress.Section>
                      <Progress.Section
                        value={(failed / (passed + failed)) * 100}
                        color="red"
                      >
                        <Progress.Label>{failed}</Progress.Label>
                      </Progress.Section>
                    </Progress.Root>
                    <Group>
                      <Text size="xs" c="dimmed">
                        avg. {duration}s
                      </Text>
                      <Text size="xs" c="dimmed">
                        avg. {formatCost(cost)}
                      </Text>
                    </Group>

                    <Text>{prompt}</Text>
                  </Stack>
                </th>
              )
            },
          )}
        </tr>
      </thead>
      <tbody>
        {variableVariations.map((variableVariation) => (
          <tr>
            {variables.map((variable) => (
              <td>{variableVariation[variable]}</td>
            ))}
            {pmVariations.map((pmVariation) => {
              const result = getResultForVariation(
                pmVariation.prompt,
                variableVariation,
                pmVariation.model,
                data,
              )
              return (
                <td>
                  {result ? (
                    <Stack align="center">
                      <ScrollArea.Autosize mah={300}>
                        <Text>{result.output.content}</Text>
                      </ScrollArea.Autosize>

                      <HoverCard withArrow width={500}>
                        <HoverCard.Target>
                          <Badge color={result.passed ? "green" : "red"}>
                            {result.passed ? "Passed" : "Failed"}
                          </Badge>
                        </HoverCard.Target>
                        <HoverCard.Dropdown>
                          <ResultDetails details={result.results} />
                        </HoverCard.Dropdown>
                      </HoverCard>
                      <Group gap="xs">
                        <Text c="dimmed" size="xs">
                          {(+result.duration / 1000).toFixed(2)}s -{" "}
                          {formatCost(result.cost)}
                        </Text>
                      </Group>
                    </Stack>
                  ) : (
                    <Badge color="gray">N/A</Badge>
                  )}
                </td>
              )
            })}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
