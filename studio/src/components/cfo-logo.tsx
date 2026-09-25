import {Flex, Text} from '@sanity/ui'

/** The Bureau seal shown in the Studio navbar. */
export function CfoLogo() {
  return (
    <Flex align="center" gap={2}>
      <svg width="28" height="28" viewBox="0 0 32 32" role="img" aria-label="Cryptid Field Office seal">
        <circle cx="16" cy="16" r="14.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="16" cy="16" r="11" fill="none" stroke="currentColor" strokeWidth="0.75" strokeDasharray="1.5 1.5" />
        <path
          d="M10.5 20.5c0-3.2 2.4-5.6 5.5-5.6s5.5 2.4 5.5 5.6M13 14.2c0-1.7 1.3-3 3-3s3 1.3 3 3"
          fill="none"
          stroke="#B42318"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <circle cx="16" cy="22.2" r="1.1" fill="#B42318" />
      </svg>
      <Text weight="semibold" size={1} style={{letterSpacing: '0.08em'}}>
        CRYPTID FIELD OFFICE
      </Text>
    </Flex>
  )
}
