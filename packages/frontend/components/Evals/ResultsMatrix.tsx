import { Badge, Group, HoverCard, Progress, Stack, Text } from "@mantine/core"
import classes from "./index.module.css"
import { formatCost } from "@/utils/format"
import { ChatMessage } from "../SmartViewer/Message"
import MessageViewer from "../SmartViewer/MessageViewer"
import SmartViewer from "../SmartViewer"
import { MODELS, Provider } from "shared"

// We create a matrix of results for each prompt, variable and model.
// The matrix is a 3D array, where each dimension represents a different variable, prompt and model.

const compareObjects = (a, b) => {
  return JSON.stringify(a) === JSON.stringify(b)
}

function getResultForVariation(
  promptId: string,
  variables: { [key: string]: string },
  provider: Provider,
  evalResults,
): any | undefined {
  const result = evalResults.find(
    (result) =>
      (promptId ? result.promptId === promptId : true) &&
      (provider ? compareObjects(result.provider, provider) : true) &&
      (Object.keys(variables).length === 0
        ? Object.keys(result.variables).length === 0
        : true) &&
      Object.keys(variables).every(
        (variable) =>
          result.variables.hasOwnProperty(variable) &&
          result.variables[variable] === variables[variable],
      ),
  )

  return result
}
const getAggegateForVariation = (
  promptId: string,
  provider: Provider,
  evalResults,
): {
  passed: number // percentage passed
  failed: number // percentage failed
  duration: number // average duration
  cost: number // average cost
} => {
  const results = evalResults.filter(
    (result) =>
      (promptId ? result.promptId === promptId : true) &&
      (provider ? compareObjects(result.provider, provider) : true),
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
  let variations = results.map((result) => ({
    promptContent: result.promptContent,
    promptId: result.promptId,
    provider: result.provider,
  }))

  const uniqueVariations = Array.from(
    new Set(variations.map((variation) => JSON.stringify(variation))),
  )
    .map((variation) => JSON.parse(variation))
    .map((variation) => {
      return {
        ...variation,
        ...getAggegateForVariation(
          variation.promptId,
          variation.provider,
          results,
        ),
      }
    })

  return uniqueVariations as {
    promptId?: string
    promptContent?: any
    provider?: Provider
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
            <Text fw="bold">{filterId}</Text>
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

  const variables = Array.from(new Set(variableVariations.flatMap(Object.keys)))

  console.log(pmVariations)

  return (
    <Stack>
      <div className={classes["matrix-container"]}>
        <table className={classes["matrix-table"]}>
          <thead>
            <tr>
              {!!variables.length && (
                <th colSpan={variables.length}>Variables</th>
              )}
              <th colSpan={data.length}>Results</th>
            </tr>
            <tr>
              {variables.map((variable, i) => (
                <th key={variable}>{variable}</th>
              ))}
              {pmVariations.map(
                (
                  {
                    provider,
                    promptId,
                    promptContent,
                    passed,
                    failed,
                    duration,
                    cost,
                  },
                  index,
                ) => {
                  return (
                    <th key={index}>
                      <Stack align="center" gap="xs">
                        {provider && (
                          <HoverCard width={500} position="bottom">
                            <HoverCard.Target>
                              <Badge variant="outline">
                                {MODELS.find(
                                  (model) => model.id === provider.model,
                                )?.name || provider.model}
                              </Badge>
                            </HoverCard.Target>
                            <HoverCard.Dropdown>
                              <Stack gap="xs">
                                <SmartViewer
                                  data={provider.config}
                                  compact={false}
                                />
                              </Stack>
                            </HoverCard.Dropdown>
                          </HoverCard>
                        )}
                        {promptId && (
                          <HoverCard width={500} position="top">
                            <HoverCard.Target>
                              <div>
                                <SmartViewer data={promptContent} compact />
                              </div>
                            </HoverCard.Target>
                            <HoverCard.Dropdown>
                              <SmartViewer
                                data={promptContent}
                                compact={false}
                              />
                            </HoverCard.Dropdown>
                          </HoverCard>
                        )}
                        {passed + failed > 1 && (
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
                        )}
                        <Group>
                          {duration && (
                            <Text size="xs" c="dimmed">
                              avg. {duration}s
                            </Text>
                          )}
                          {cost && (
                            <Text size="xs" c="dimmed">
                              avg. {formatCost(cost)}
                            </Text>
                          )}
                        </Group>
                      </Stack>
                    </th>
                  )
                },
              )}
            </tr>
          </thead>
          <tbody>
            {variableVariations.map((variableVariation, i) => (
              <tr key={i}>
                {variables.map((variable) => (
                  <td>{variableVariation[variable]}</td>
                ))}
                {pmVariations.map((pmVariation, k) => {
                  const result = getResultForVariation(
                    pmVariation.promptId,
                    variableVariation,
                    pmVariation.provider,
                    data,
                  )
                  return (
                    <td className={classes["output-cell"]} key={k}>
                      {result ? (
                        <>
                          {result.status === "success" ? (
                            <Stack align="center" justify="between" h="100%">
                              <ChatMessage
                                data={result.output}
                                mah={200}
                                compact
                              />

                              <HoverCard width={500}>
                                <HoverCard.Target>
                                  <Badge
                                    color={result.passed ? "green" : "red"}
                                  >
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
                            <Text color="red">{result.error || "Error"}</Text>
                          )}
                        </>
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
      </div>
    </Stack>
  )
}
