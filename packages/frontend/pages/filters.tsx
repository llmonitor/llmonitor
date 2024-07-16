import {
  Badge,
  Button,
  Card,
  Container,
  Group,
  Slider,
  Stack,
  Text,
  Title,
} from "@mantine/core"

function FilterSlider({ label }) {
  return (
    <Group align="center">
      <Text w={120}>{label}</Text>
      <Slider
        w={350}
        value={100}
        color="blue"
        marks={[
          { value: 0, label: "None" },
          { value: 33, label: "Low" },
          { value: 66, label: "Med" },
          { value: 100, label: "High" },
        ]}
      />
    </Group>
  )
}

export default function Filters() {
  return (
    <Container>
      <Stack>
        <Group align="center">
          <Title fw="bold">Content Filters</Title>
          <Badge variant="light" color="violet">
            Beta
          </Badge>
        </Group>

        <Card p="xl" withBorder>
          <Stack gap="xl">
            <Title order={3}>Thresholds</Title>
            <Stack gap="xl" mb="sm">
              <FilterSlider label="Hate" />
              <FilterSlider label="Sexism" />
              <FilterSlider label="Insults" />
              <FilterSlider label="Violence" />
              <FilterSlider label="Sexual" />
              <FilterSlider label="Politics" />
            </Stack>
            <Button color="blue" variant="light" w="fit-content">
              Add Custom Topic
            </Button>
          </Stack>
        </Card>
      </Stack>
    </Container>
  )
}
