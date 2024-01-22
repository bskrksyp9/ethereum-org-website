import { type RefObject, useCallback, useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { useRouter } from "next/router"
import { BsCircle } from "react-icons/bs"
import { MdChevronLeft, MdChevronRight } from "react-icons/md"
import {
  Box,
  type ButtonProps,
  calc,
  Flex,
  type FlexProps,
  Grid,
  Icon,
  type IconProps,
  List,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Text,
  useToken,
} from "@chakra-ui/react"

import type { Lang } from "@/lib/types"

import { Button } from "@/components/Buttons"
import Link from "@/components/Link"

import { isLangRightToLeft } from "@/lib/utils/translations"
import { cleanPath } from "@/lib/utils/url"

import { SECTION_LABELS } from "@/lib/constants"

import type { Level, NavItem, NavSectionKey, NavSections } from "./types"

type ActiveState =
  | { section: null; lvl1: null; lvl2: null; lvl3: null }
  | { section: NavSectionKey; lvl1: null; lvl2: null; lvl3: null }
  | { section: NavSectionKey; lvl1: number; lvl2: null; lvl3: null }
  | { section: NavSectionKey; lvl1: number; lvl2: number; lvl3: null }
  | { section: NavSectionKey; lvl1: number; lvl2: number; lvl3: number }

const activeNull: ActiveState = {
  section: null,
  lvl1: null,
  lvl2: null,
  lvl3: null,
}

type NextChevronProps = IconProps & {
  lvl: Level
  isLink: boolean
}

const NextChevron = ({ lvl, isLink, ...props }: NextChevronProps) => {
  const { locale } = useRouter()
  if (isLink) return undefined
  const isRtl = isLangRightToLeft(locale! as Lang)
  return (
    <Icon
      as={isRtl ? MdChevronLeft : MdChevronRight}
      fill={`menu.lvl${lvl}.main`}
      {...props}
    />
  )
}

type GetHoverActionsArgs = {
  lvl: Level
  index: number
  href?: string
}

type MenuButtonProps = {
  item: NavItem
  lvl: Level
  index: number
  getHoverActions: (args: GetHoverActionsArgs) => Partial<ButtonProps>
}

const MenuButton = ({ item, lvl, index, getHoverActions }: MenuButtonProps) => {
  const { label, description, icon: CustomIcon, ...action } = item
  const { asPath } = useRouter()
  const isLink = !!action.href
  const isActive = isLink && cleanPath(asPath) === action.href
  const minW = calc.subtract(
    calc.multiply(useToken("sizes.container", "md"), 0.5),
    useToken("space", 8)
  ) // Half of `md` container (smallest desktop width) minus padding

  return (
    <Button
      as={isLink ? Link : undefined}
      href={action.href}
      minW={minW}
      rightIcon={
        <NextChevron
          lvl={lvl}
          isLink={isLink}
          _groupHover={{ fill: "menu.highlight" }}
        />
      }
      leftIcon={
        lvl === 1 ? (
          <Icon
            as={CustomIcon || BsCircle}
            color={isActive ? "menu.active" : `menu.lvl${lvl}.main`}
            _groupHover={{ color: "menu.highlight" }}
          />
        ) : undefined
      }
      sx={{ "span:first-of-type": { m: 0, me: 4 } }}
      py="4"
      bg={`menu.lvl${lvl}.background`}
      me={isLink ? undefined : -4}
      data-group
      _hover={{
        bg: `menu.lvl${lvl + 1}.background`,
        borderInlineEndRadius: isLink ? undefined : "none",
        boxShadow: "none",
      }}
      _active={{
        bg: `menu.lvl${lvl + 1}.background`,
        borderInlineEndRadius: isLink ? undefined : "none",
        boxShadow: "none",
      }}
      // TODO: _focus styles
      {...getHoverActions({ lvl, index, href: action.href })}
    >
      <Box me="auto" textAlign="start">
        <Text
          fontWeight="bold"
          color={isActive ? "highContrast" : `menu.lvl${lvl}.main`}
          _groupHover={{ color: "menu.highlight" }}
        >
          {label}
        </Text>
        <Text
          fontSize="sm"
          color={isActive ? "menu.active" : `menu.lvl${lvl}.subtext`}
          _groupHover={{ color: "menu.highlight" }}
        >
          {description}
        </Text>
      </Box>
    </Button>
  )
}

export type MenuProps = FlexProps & {
  sections: NavSections
}

// TODO (a11y): Keyboard arrow navigation
// TODO (style): Implement custom icons

const Menu = ({ sections, ...props }: MenuProps) => {
  const { locale } = useRouter()
  const isRtl = isLangRightToLeft(locale! as Lang)

  const [active, setActive] = useState<ActiveState>(activeNull)

  const menuGridRef = useRef<HTMLDivElement>(null)

  const onOpen = (key: NavSectionKey) => {
    setActive((prev) => ({ ...prev, section: key } as ActiveState))
  }

  const onClose = () => {
    setActive(activeNull)
  }

  const isOpen = !!active.section

  const getLvl1Items = (): NavItem[] => {
    if (!active.section) return []
    return sections[active.section as NavSectionKey].items || []
  }

  const getLvl2Items = (): NavItem[] => {
    if (!active.section || active.lvl1 === null) return []
    const lvl1Items = sections[active.section as NavSectionKey].items
    const lvl2Items = lvl1Items[active.lvl1 % lvl1Items.length].items || []
    return lvl2Items
  }

  const getLvl3Items = (): NavItem[] => {
    if (!active.section || active.lvl1 === null || active.lvl2 === null)
      return []
    const lvl1Items = sections[active.section as NavSectionKey].items
    const lvl2Items = lvl1Items[active.lvl1 % lvl1Items.length].items || []
    if (lvl2Items.length === 0) return []
    const lvl3Items = lvl2Items[active.lvl2].items || []
    return lvl3Items
  }

  const has = {
    lvl1Items: getLvl1Items().length > 0,
    lvl2Items: getLvl2Items().length > 0,
    lvl3Items: getLvl3Items().length > 0,
  } as const

  const scrollToEnd = useCallback(
    (ref: RefObject<HTMLElement>) => {
      ref.current?.scrollTo({
        left: ref.current.scrollWidth * (isRtl ? -1 : 1),
      })
    },
    [isRtl]
  )

  useEffect(() => {
    if (has.lvl3Items) {
      scrollToEnd(menuGridRef)
    }
  }, [has.lvl2Items, has.lvl3Items, scrollToEnd])

  const setActiveIndex = (lvl: Level, index: number | null) => {
    if (lvl === 3) {
      setActive((prev) => ({ ...prev, lvl3: index } as ActiveState))
    } else if (lvl === 2) {
      setActive((prev) => ({ ...prev, lvl2: index, lvl3: null } as ActiveState))
    } else {
      setActive(
        (prev) =>
          ({
            ...prev,
            lvl1: index,
            lvl2: null,
            lvl3: null,
          } as ActiveState)
      )
    }
  }

  const getLvlContainerProps = (lvl: Level): FlexProps => ({
    bg: `menu.lvl${lvl}.background`,
    color: `menu.lvl${lvl}.main`,
    p: 4,
    me: 0,
    direction: "column",
    zIndex: 1 - lvl,
  })

  const x = isRtl ? "100%" : "-100%"

  const slideAnimationProps = {
    as: motion.div,
    initial: { x, scaleX: 0 },
    animate: { x: 0, scaleX: 1 },
    exit: { x, scaleX: 0 },
  } as const

  const getHoverActions = ({
    lvl,
    index,
    href,
  }: GetHoverActionsArgs): Partial<ButtonProps> => ({
    isActive: active[`lvl${lvl}`] === index,
    onClick: () => {
      href ? onClose() : setActiveIndex(1, index)
    },
    onMouseEnter: () => setActiveIndex(lvl, index),
    onFocusCapture: () => setActiveIndex(lvl, index),
  })

  return (
    <Popover
      isOpen={isOpen}
      onClose={onClose}
      placement="bottom-start"
      autoFocus
    >
      <PopoverTrigger>
        <Flex as={List} display="flex" alignItems="center" m="0" {...props}>
          {SECTION_LABELS.map((key) => {
            const { label, ariaLabel } = sections[key]
            return (
              <Button
                key={key}
                isActive={active.section === key}
                variant="ghost"
                color="menu.lvl1.main"
                sx={{ span: { m: 0 } }}
                _hover={{ color: "menu.highlight" }}
                _active={{ color: "menu.highlight" }}
                onClick={() => onOpen(key)}
                onMouseEnter={() => {
                  if (!isOpen) return
                  setActive(
                    (prev) => ({ ...prev, section: key } as ActiveState)
                  )
                }}
                aria-label={ariaLabel}
              >
                {active.section === key && (
                  <motion.div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "var(--eth-colors-primary-lowContrast",
                      borderRadius: "var(--eth-radii-base)",
                    }}
                    transition={{ duration: 0.2 }}
                    layoutId="menu-section-highlight"
                  />
                )}
                <Text as="span" position="relative" zIndex="1">
                  {label}
                </Text>
              </Button>
            )
          })}
        </Flex>
      </PopoverTrigger>
      <PopoverContent
        hideBelow="md"
        display="grid"
        scrollBehavior="smooth"
        ref={menuGridRef}
        shadow="md"
        border="1px"
        borderColor="menu.stroke"
        position="absolute"
        bg={`menu.lvl${has.lvl3Items ? 3 : has.lvl2Items ? 2 : 1}.background`}
        insetInlineStart={{ base: "-3rem", xl: "-5.375rem" }}
        w="min(100vw, 1504px)"
        mx="auto"
        isolation="isolate"
        onMouseLeave={() => setActiveIndex(1, null)}
        overflow="auto"
      >
        <Grid gridTemplateColumns="repeat(3, 1fr)" zIndex={0}>
          {has.lvl1Items && (
            <Flex {...getLvlContainerProps(1)}>
              {getLvl1Items().map((item, index) => (
                <MenuButton
                  key={item.label}
                  item={item}
                  lvl={1}
                  index={index}
                  getHoverActions={getHoverActions}
                />
              ))}
            </Flex>
          )}
          <AnimatePresence>
            {has.lvl2Items && (
              <Flex {...slideAnimationProps} {...getLvlContainerProps(2)}>
                {getLvl2Items().map((item, index) => (
                  <MenuButton
                    key={item.label}
                    item={item}
                    lvl={2}
                    index={index}
                    getHoverActions={getHoverActions}
                  />
                ))}
              </Flex>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {has.lvl3Items && (
              <Flex {...slideAnimationProps} {...getLvlContainerProps(3)}>
                {getLvl3Items().map((item, index) => (
                  <MenuButton
                    key={item.label}
                    item={item}
                    lvl={3}
                    index={index}
                    getHoverActions={getHoverActions}
                  />
                ))}
              </Flex>
            )}
          </AnimatePresence>
        </Grid>
      </PopoverContent>
    </Popover>
  )
}

export default Menu
