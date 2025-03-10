import { useBoolean } from "usehooks-ts"

/**
 * Hook that provides a more semantic API for managing the open/close state of a
 * modal, dropdown, or any other component that can be opened and closed.
 */
function useDisclosure(defaultValue = false) {
  const { value, setTrue, setFalse, toggle } = useBoolean(defaultValue)

  return {
    isOpen: value,
    onOpen: setTrue,
    onClose: setFalse,
    onToggle: toggle,
  }
}

export default useDisclosure
