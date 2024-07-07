import {
  ActionIcon,
  Box,
  Collapse,
  Flex,
  Group,
  Menu,
  NavLink,
  SegmentedControl,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
  useMantineColorScheme,
} from "@mantine/core"

import {
  IconActivity,
  IconActivityHeartbeat,
  IconAnalyze,
  IconArrowRight,
  IconBinaryTree2,
  IconBolt,
  IconBooks,
  IconBrandOpenai,
  IconChevronRight,
  IconCreditCard,
  IconDatabase,
  IconFlask,
  IconFlask2Filled,
  IconFlaskFilled,
  IconHelpCircle,
  IconHelpOctagon,
  IconHelpSmall,
  IconListSearch,
  IconListTree,
  IconLogout,
  IconMessage2,
  IconMessages,
  IconMoon,
  IconNotebook,
  IconPaint,
  IconPlayerPlay,
  IconSearch,
  IconSettings,
  IconSparkles,
  IconSun,
  IconTimeline,
  IconUsers,
} from "@tabler/icons-react"

import UserAvatar from "@/components/blocks/UserAvatar"
import { useOrg, useUser } from "@/utils/dataHooks"
import Link from "next/link"
import { useRouter } from "next/router"
import { openUpgrade } from "./UpgradeModal"

import analytics from "@/utils/analytics"
import { Button, Combobox, Input, InputBase, useCombobox } from "@mantine/core"

import { IconPlus } from "@tabler/icons-react"

import { useAuth } from "@/utils/auth"
import { useProject, useProjects } from "@/utils/dataHooks"
import { useEffect, useState } from "react"
import { ResourceName, hasAccess, hasReadAccess, serializeLogic } from "shared"
import config from "@/utils/config"
import { useViews } from "@/utils/dataHooks/views"
import { useDisclosure, useFocusTrap } from "@mantine/hooks"

function NavbarLink({
  icon: Icon,
  label,
  link,
  soon,
  onClick,
  disabled = false,
}) {
  const router = useRouter()

  // For logs pages, we want to compare the full url because it contains the view ID and filters info
  const active = router.pathname.startsWith("/logs")
    ? router.asPath.includes(`&view`)
      ? router.asPath.includes(`&view=${link.split("view=")[1]}`)
      : router.asPath.startsWith(link)
    : router.pathname.startsWith(link)

  const handleNavigation = (link) => {
    router.push(link, undefined, { shallow: true })
  }

  return (
    <NavLink
      w="100%"
      pl={5}
      onClick={onClick || (() => handleNavigation(link))}
      h={30}
      label={<Text size="xs">{`${label}${soon ? " (soon)" : ""}`}</Text>}
      disabled={disabled || soon}
      active={active}
      leftSection={
        <ThemeIcon variant={"subtle"} size="md" mr={-10}>
          <Icon size={14} opacity={0.7} />
        </ThemeIcon>
      }
    />
  )
}

type MenuItem = {
  label: string
  icon?: any
  link?: string
  resource?: ResourceName
  disabled?: boolean
  searchable?: boolean
  c?: string
  isSection?: boolean
  subMenu?: MenuItem[]
}

const ViewIcons = {
  llm: IconBrandOpenai,
  thread: IconMessages,
  trace: IconListTree,
}

function MenuSection({ item }) {
  const { user } = useUser()

  const [opened, { toggle }] = useDisclosure(true)
  const [query, setQuery] = useState("")

  const [searchOn, setSearchOn] = useState(false)

  const focusTrapRef = useFocusTrap()

  const filtered = item.subMenu?.filter((subItem) =>
    subItem.label.toLowerCase().includes(query.toLowerCase()),
  )

  return (
    <Box mb="sm" mt="sm">
      <Group gap={3} align="center" justify="space-between" px="sm">
        {searchOn ? (
          <TextInput
            size="xs"
            py={0}
            h={16}
            leftSection={<IconSearch size={12} />}
            mb={15}
            styles={{
              input: {},
            }}
            ref={focusTrapRef}
            placeholder="Search"
            value={query}
            onChange={(e) => setQuery(e.currentTarget.value)}
            onBlur={() => {
              setSearchOn(false)
              setQuery("")
            }}
          />
        ) : (
          <>
            <Text
              mb={5}
              fz={12}
              fw={400}
              opacity={0.8}
              onClick={toggle}
              style={{ cursor: "pointer" }}
            >
              {item.label}
            </Text>
            <Group gap={6} align="center">
              {item.searchable && opened && (
                <IconSearch
                  onClick={() => setSearchOn(true)}
                  size={14}
                  ml="auto"
                  opacity={0.4}
                  style={{
                    cursor: "pointer",
                    position: "relative",
                    top: -2,
                  }}
                />
              )}

              <IconChevronRight
                onClick={toggle}
                size={14}
                opacity={0.6}
                style={{
                  cursor: "pointer",
                  position: "relative",
                  top: -2,
                  transform: `rotate(${opened ? 90 : 0}deg)`,
                }}
              />
            </Group>
          </>
        )}
      </Group>

      <Collapse in={opened}>
        {filtered
          ?.filter((subItem) => hasReadAccess(user.role, subItem.resource))
          .map((subItem, i) => <NavbarLink {...subItem} key={i} />)}
      </Collapse>
    </Box>
  )
}

export default function Sidebar() {
  const auth = useAuth()
  const router = useRouter()
  const { project, setProjectId } = useProject()

  const { user } = useUser()
  const { org } = useOrg()
  const { projects, isLoading: loading, insert } = useProjects()
  const { views } = useViews()

  const { colorScheme, setColorScheme } = useMantineColorScheme({})

  const [createProjectLoading, setCreateProjectLoading] = useState(false)

  const combobox = useCombobox()

  const isSelfHosted = config.IS_SELF_HOSTED

  const billingEnabled =
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY && !config.IS_SELF_HOSTED

  const canUpgrade = billingEnabled && ["free", "pro"].includes(org?.plan)

  const projectViews = (views || [])
    .map((v) => {
      const serialized = serializeLogic(v.data)

      const Icon = ViewIcons[v.data[1].params.type]

      return {
        label: v.name,
        icon: Icon,
        link: `/logs?${serialized}&view=${v.id}`,
        resource: "logs",
      }
    })
    .sort((a, b) => a.label.localeCompare(b.label))

  const APP_MENU: MenuItem[] = [
    {
      label: "Observe",
      isSection: true,
      c: "blue",
      subMenu: [
        {
          label: "Analytics",
          icon: IconTimeline,
          link: "/analytics",
          resource: "analytics",
        },
        {
          label: "LLM",
          icon: IconBrandOpenai,
          link: "/logs?type=llm",
          resource: "logs",
        },
        {
          label: "Traces",
          icon: IconBinaryTree2,
          link: "/logs?type=trace",
          resource: "logs",
        },
        {
          label: "Threads",
          icon: IconMessages,
          link: "/logs?type=thread",
          resource: "logs",
        },
        { label: "Users", icon: IconUsers, link: "/users", resource: "users" },
      ],
    },
    {
      label: "Build",
      c: "violet",
      disabled: isSelfHosted ? org.license && !org.license.evalEnabled : false,
      subMenu: [
        {
          label: "Prompts",
          icon: IconNotebook,
          link: "/prompts",
          resource: "prompts",
        },
        {
          label: "Playground",
          icon: IconFlask,
          link: "/evaluations/new",
          resource: "evaluations",
        },
        {
          label: "Evaluators",
          icon: IconActivityHeartbeat,
          link: "/evaluations/realtime",
          resource: "evaluations",
        },
      ],
    },
    !!projectViews.length && {
      label: "Smart Views",
      icon: IconListSearch,
      searchable: true,
      resource: "logs",
      subMenu: projectViews,
    },
    {
      label: "Project",
      resource: "apiKeys",
      subMenu: [
        {
          label: "Settings",
          icon: IconSettings,
          link: "/settings",
          resource: "apiKeys",
        },
        {
          label: "Datasets",
          icon: IconDatabase,
          link: "/datasets",
          resource: "datasets",
        },
        !!canUpgrade && {
          label: "Upgrade",
          onClick: openUpgrade,
          c: "vioplet",
          icon: IconBolt,
          disabled: !canUpgrade,
          resource: "billing",
        },
      ].filter((item) => item),
    },
  ]

  async function createProject() {
    if (org.plan === "free" && projects.length >= 3) {
      return openUpgrade("projects")
    }

    setCreateProjectLoading(true)

    const name = `Project #${projects.length + 1}`
    try {
      const { id } = await insert({ name })
      analytics.track("Create Project", {
        name,
      })

      setCreateProjectLoading(false)
      setProjectId(id)
      router.push(`/settings`)
    } catch (error) {
      console.error(error)
    } finally {
      setCreateProjectLoading(false)
    }
  }

  // Select first project if none selected
  useEffect(() => {
    if (!project && projects?.length && !loading) {
      setProjectId(projects[0].id)
    }
  }, [project, projects, loading, setProjectId])

  return (
    <Flex
      justify="space-between"
      align="start"
      w={200}
      mah="100vh"
      direction="column"
      style={{
        overflowY: "auto",
        borderRight: "1px solid var(--mantine-color-default-border)",
      }}
    >
      <Stack w="100%" gap={0}>
        <Box w="100%">
          <Combobox
            store={combobox}
            withinPortal={false}
            onOptionSubmit={(id) => {
              setProjectId(id)
              combobox.closeDropdown()
            }}
          >
            <Combobox.Target>
              <InputBase
                component="button"
                size="xs"
                mx="xs"
                my="xs"
                w="auto"
                type="button"
                pointer
                leftSection={<IconAnalyze size={16} />}
                rightSection={<Combobox.Chevron />}
                onClick={() => combobox.toggleDropdown()}
                rightSectionPointerEvents="none"
              >
                {project?.name || (
                  <Input.Placeholder>Select project</Input.Placeholder>
                )}
              </InputBase>
            </Combobox.Target>
            <Combobox.Dropdown>
              <Combobox.Options>
                {projects?.map((item) => (
                  <Combobox.Option value={item.id} key={item.id}>
                    {item.name}
                  </Combobox.Option>
                ))}
              </Combobox.Options>
              <Combobox.Footer>
                <Button
                  loading={createProjectLoading}
                  size="xs"
                  onClick={createProject}
                  data-testid="new-project"
                  variant="light"
                  fullWidth
                  leftSection={<IconPlus size={12} />}
                >
                  Create project
                </Button>
              </Combobox.Footer>
            </Combobox.Dropdown>
          </Combobox>

          {user &&
            APP_MENU.filter((item) => !item.disabled).map((item) => (
              <MenuSection item={item} key={item.label} />
            ))}
        </Box>
      </Stack>

      {user && (
        <>
          <Box w="100%">
            {canUpgrade && (
              <NavLink
                label="Unlock all features"
                onClick={() => openUpgrade("features")}
                fw={700}
                c="pink.9"
                style={{
                  backgroundColor: "var(--mantine-color-red-1)",
                  borderRadius: 6,
                  padding: 7,
                  margin: 10,
                  width: "calc(100% - 20px)",
                }}
                leftSection={
                  <IconSparkles
                    color={"var(--mantine-color-red-9)"}
                    size={16}
                  />
                }
              />
            )}

            <Group p="sm" justify="space-between">
              <Menu>
                <Menu.Target>
                  <ActionIcon
                    variant="outline"
                    color="gray"
                    radius="xl"
                    size={26}
                  >
                    <IconHelpSmall size={60} stroke={1.5} />
                  </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                  {process.env.NEXT_PUBLIC_CRISP_ID && (
                    <Menu.Item
                      leftSection={<IconMessage2 size={14} />}
                      onClick={() => {
                        $crisp.push(["do", "chat:open"])
                      }}
                    >
                      Feedback
                    </Menu.Item>
                  )}
                  <Menu.Item
                    component="a"
                    href="https://lunary.ai/docs"
                    leftSection={<IconHelpOctagon size={14} />}
                  >
                    Documentation
                  </Menu.Item>
                  <Menu.Item
                    component="a"
                    href="https://lunary.ai/changelog"
                    leftSection={<IconActivity size={14} />}
                  >
                    Changelog
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>

              <Menu closeOnItemClick={false}>
                <Menu.Target>
                  <ActionIcon variant="subtle" radius="xl" size={32}>
                    <UserAvatar
                      size={26}
                      profile={user}
                      data-testid="account-sidebar-item"
                    />
                  </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item>
                    <Stack gap={0}>
                      <Text
                        mb={-3}
                        size="xs"
                        style={{
                          textOverflow: "ellipsis",
                          overflow: "hidden",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {user?.name}
                      </Text>
                      <Text
                        size="xs"
                        c="dimmed"
                        style={{
                          textOverflow: "ellipsis",
                          overflow: "hidden",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {user?.email}
                      </Text>
                    </Stack>
                  </Menu.Item>
                  <Menu.Item
                    leftSection={<IconPaint opacity={0.6} size={14} />}
                  >
                    <SegmentedControl
                      value={colorScheme}
                      size="xs"
                      onChange={setColorScheme}
                      data={[
                        { value: "auto", label: "Auto" },
                        {
                          value: "light",
                          label: (
                            <IconSun
                              style={{ position: "relative", top: 2 }}
                              size={15}
                            />
                          ),
                        },
                        {
                          value: "dark",
                          label: (
                            <IconMoon
                              style={{ position: "relative", top: 2 }}
                              size={15}
                            />
                          ),
                        },
                      ]}
                    />
                  </Menu.Item>
                  <Menu.Divider />
                  {billingEnabled &&
                    hasAccess(user.role, "billing", "read") && (
                      <Menu.Item
                        leftSection={<IconCreditCard opacity={0.6} size={14} />}
                        onClick={() => router.push("/billing")}
                      >
                        Usage & Billing
                      </Menu.Item>
                    )}

                  {hasAccess(user.role, "teamMembers", "read") && (
                    <Menu.Item
                      leftSection={<IconUsers opacity={0.6} size={14} />}
                      onClick={() => router.push("/team")}
                    >
                      Team
                    </Menu.Item>
                  )}
                  <Menu.Divider />
                  <Menu.Item
                    c="red"
                    data-testid="logout-button"
                    onClick={() => auth.signOut()}
                    leftSection={<IconLogout size={14} />}
                  >
                    Logout
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            </Group>
          </Box>
        </>
      )}
    </Flex>
  )
}
