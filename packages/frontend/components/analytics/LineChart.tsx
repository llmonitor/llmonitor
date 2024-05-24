import {
  Alert,
  Box,
  Button,
  Card,
  Center,
  Tooltip as MantineTooltip,
  Group,
  Overlay,
  Text,
  Title,
} from "@mantine/core"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts"

import { formatLargeNumber } from "@/utils/format"
import { IconBolt, IconInfoCircle } from "@tabler/icons-react"
import { eachDayOfInterval, format, parseISO } from "date-fns"
import { Fragment } from "react"
import ErrorBoundary from "../blocks/ErrorBoundary"
import { openUpgrade } from "../layout/UpgradeModal"
import { theme } from "@/utils/theme"

const slugify = (str) => {
  return str
    .toLowerCase()
    .replace(/ /g, "-")
    .replace(/[^\w-]+/g, "")
}

const generateFakeData = (range: number) => {
  const data = []
  for (let i = 0; i < range; i++) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const users = Math.floor(Math.random() * 6000) + 4000
    data.push({
      date: date.toISOString().split("T")[0],
      users: users,
    })
  }
  return data
}

function prepareDataForRecharts(
  data: any[],
  splitBy: string | undefined,
  props: string[],
  range: number,
): any[] {
  // Create a map to hold the processed data
  // const dataMap = {}
  const output: any[] = []

  if (!data) data = []

  // get all the possible values for the splitBy prop
  // will be 1 chart per value
  const uniqueSplitByValues =
    splitBy &&
    Array.from(new Set(data.map((item) => item[splitBy]?.toString())))

  // Initialize map with dates as keys and empty data as values
  eachDayOfInterval({
    // subtract 'range' amount of days for start date
    start: new Date(new Date().getTime() - range * 24 * 60 * 60 * 1000),
    end: new Date(),
  }).forEach((day) => {
    const date = format(day, "yyyy-MM-dd")

    const dayData: { [key: string]: any } = { date }

    for (let prop of props) {
      if (splitBy) {
        for (let splitByValue of uniqueSplitByValues) {
          dayData[`${splitByValue} ${prop}`] =
            data?.find(
              (item) =>
                item[splitBy]?.toString() === splitByValue &&
                format(parseISO(item.date), "yyyy-MM-dd") === date,
            )?.[prop] || 0
        }
      } else {
        dayData[prop] =
          data.find(
            (item) => format(parseISO(item.date), "yyyy-MM-dd") === date,
          )?.[prop] || 0
      }
    }

    output.push(dayData)
  })

  return output.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  )
}

const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })

const CustomizedAxisTick = ({ x, y, payload, index, data }) => {
  // Hide the first and last tick
  if (index === 0 || index === data.length - 1) {
    return null
  }

  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={16} textAnchor="middle" fill="#666">
        {new Date(payload.value).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })}
      </text>
    </g>
  )
}

type LineChartProps = {
  data: any[]
  title: string | JSX.Element
  props: string[]
  blocked: boolean
  formatter?: (value: number) => string
  height?: number
  splitBy?: string
  description?: string
  range: number
  agg: string
  chartExtra?: JSX.Element
}

function getFigure(agg: string, data: any[], prop: string) {
  if (agg === "sum") {
    return data.reduce((acc, item) => acc + item[prop], 0)
  } else if (agg === "avg") {
    return data.reduce((acc, item) => acc + item[prop], 0) / data.length
  } else if (agg === "max") {
    return data.reduce((acc, item) => Math.max(acc, item[prop]), 0)
  } else if (agg === "min") {
    return data.reduce((acc, item) => Math.min(acc, item[prop]), 0)
  }
}

const LineChartComponent = ({
  data,
  title,
  props,
  blocked,
  formatter = formatLargeNumber,
  height = 300,
  description,
  splitBy = undefined,
  range,
  agg,
  chartExtra,
}: LineChartProps) => {
  const colors = ["blue", "pink", "indigo", "green", "violet", "yellow"]

  const cleanedData = prepareDataForRecharts(
    blocked ? generateFakeData(range) : data,
    splitBy,
    props,
    range,
  )

  const hasData = blocked
    ? true
    : cleanedData?.length &&
      (splitBy ? Object.keys(cleanedData[0]).length > 1 : data?.length)

  const total = getFigure(agg, cleanedData, props[0])

  return (
    <Card withBorder p={0} className="lineChart" radius="md">
      <Group gap="xs">
        {typeof title === "string" ? (
          <Text c="dimmed" fw={50} fz="md" m="md" mr={0}>
            {title}
          </Text>
        ) : (
          <Box m="lg" mb="sm">
            {title}
          </Box>
        )}

        {description && (
          <MantineTooltip label={description}>
            <IconInfoCircle size={16} opacity={0.5} />
          </MantineTooltip>
        )}
      </Group>

      {!!total && (
        <Text fw={500} fz={24} mt={-12} ml="md">
          {total}
        </Text>
      )}

      <Box mt="sm" pos="relative">
        {blocked && (
          <>
            <Overlay
              h="100%"
              blur={15}
              backgroundOpacity={0.1}
              p="lg"
              zIndex={1}
            />
            <Center
              ta="center"
              style={{
                position: "absolute",
                zIndex: 2,
              }}
              h="100%"
              w="100%"
            >
              <Alert
                title="Advanced Analytics"
                bg="var(--mantine-primary-color-light)"
                p="12"
              >
                Upgrade to <b>Team</b> to unlock this chart
                <br />
                <Button
                  mt="md"
                  onClick={() => openUpgrade("analytics")}
                  size="xs"
                  variant="gradient"
                  gradient={{ from: "#0788ff", to: "#9900ff", deg: 30 }}
                  leftSection={<IconBolt size="16" />}
                >
                  Upgrade
                </Button>
              </Alert>
            </Center>
          </>
        )}

        {!hasData && (
          <>
            <Overlay blur={5} opacity={0.1} p="lg" zIndex={1} />
            <Center
              ta="center"
              style={{ position: "absolute", zIndex: 2 }}
              h="100%"
              w="100%"
            >
              No data available for this period
            </Center>
          </>
        )}

        <ResponsiveContainer width="100%" height={height}>
          <AreaChart
            width={500}
            height={420}
            data={hasData ? cleanedData : []}
            margin={{
              top: 10,
              right: 0,
              left: 0,
              bottom: 10,
            }}
          >
            {hasData && (
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={true}
                opacity={0.7}
                vertical={false}
              />
            )}
            <XAxis
              dataKey="date"
              tick={({ x, y, payload, index }) => (
                <CustomizedAxisTick
                  x={x}
                  y={y}
                  payload={payload}
                  index={index}
                  data={cleanedData}
                />
              )}
              style={{
                marginLeft: 20,
              }}
              interval="preserveStartEnd"
              tickLine={false}
              axisLine={false}
              minTickGap={5}
              max={7}
            />

            <Tooltip
              formatter={formatter}
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <Card shadow="md" withBorder>
                      <Title order={3} size="sm">
                        {formatDate(label)}
                      </Title>
                      {payload.map((item, i) => (
                        <Text key={i}>{`${item.name}: ${formatter(
                          item.value,
                        )}`}</Text>
                      ))}
                    </Card>
                  )
                }

                return null
              }}
            />

            {cleanedData[0] &&
              Object.keys(cleanedData[0])
                .filter((prop) => prop !== "date")
                .map((prop, i) => (
                  <Fragment key={prop}>
                    <defs key={prop}>
                      <linearGradient
                        color={theme.colors[colors[i % colors.length]][6]}
                        id={slugify(prop)}
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="currentColor"
                          stopOpacity={0.4}
                        />
                        <stop
                          offset="95%"
                          stopColor="currentColor"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      color={theme.colors[colors[i % colors.length]][4]}
                      dataKey={prop}
                      stackId="1"
                      stroke="currentColor"
                      dot={false}
                      fill={`url(#${slugify(prop)})`}
                      strokeWidth={2}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />
                  </Fragment>
                ))}

            {chartExtra}
          </AreaChart>
        </ResponsiveContainer>
      </Box>
      <style jsx>{`
        :global(.lineChart .mantine-Alert-title) {
          justify-content: center;
        }
      `}</style>
    </Card>
  )
}

const LineChart = (props: LineChartProps) => (
  <ErrorBoundary>
    <LineChartComponent {...props} />
  </ErrorBoundary>
)

export default LineChart
