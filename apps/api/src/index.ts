import { defineAbilityFor } from '@saas/auth'

const ability = defineAbilityFor({ role: 'MEMBER', id: 'teste' })

const userCanInviteSomeoneElese = ability.can('create', 'Project')
const userCanDeleteOtherUsers = ability.can('delete', 'User')

const userCannotDeleteOtherUsers = ability.cannot('delete', 'User')

console.log(userCanInviteSomeoneElese)
console.log(userCanDeleteOtherUsers)
console.log(userCannotDeleteOtherUsers)
