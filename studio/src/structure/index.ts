import type {StructureBuilder, StructureResolver} from 'sanity/structure'
import {ArchiveIcon} from '@sanity/icons/Archive'
import {BulbOutlineIcon} from '@sanity/icons/BulbOutline'
import {CogIcon} from '@sanity/icons/Cog'
import {DocumentIcon} from '@sanity/icons/Document'
import {EyeClosedIcon} from '@sanity/icons/EyeClosed'
import {InboxIcon} from '@sanity/icons/Inbox'
import {LinkIcon} from '@sanity/icons/Link'
import {LockIcon} from '@sanity/icons/Lock'
import {PinIcon} from '@sanity/icons/Pin'
import {SearchIcon} from '@sanity/icons/Search'
import {TagIcon} from '@sanity/icons/Tag'
import {UserIcon} from '@sanity/icons/User'
import {BoltIcon} from '@sanity/icons/Bolt'
import {CATEGORIES} from '../../schemaTypes/constants'

/** Fixed IDs of the singleton documents. Seed scripts and functions rely on these. */
export const BUREAU_SETTINGS_ID = 'bureau-settings'

const newestFirst = [{field: '_updatedAt', direction: 'desc' as const}]

function caseList(S: StructureBuilder, title: string, filter: string, params: Record<string, unknown> = {}) {
  return S.documentList()
    .title(title)
    .schemaType('case')
    .filter(`_type == "case" && ${filter}`)
    .params(params)
    .defaultOrdering(newestFirst)
}

function statusItem(
  S: StructureBuilder,
  title: string,
  statuses: string[],
  icon: typeof InboxIcon,
) {
  return S.listItem()
    .id(`cases-${statuses.join('-')}`)
    .title(title)
    .icon(icon)
    .child(caseList(S, title, 'status in $statuses', {statuses}))
}

export const structure: StructureResolver = (S) =>
  S.list()
    .id('root')
    .title('Bureau')
    .items([
      S.listItem()
        .id('case-files')
        .title('Case files')
        .icon(DocumentIcon)
        .child(
          S.list()
            .id('case-files-list')
            .title('Case files')
            .items([
              statusItem(S, 'Intake (awaiting triage)', ['intake'], InboxIcon),
              statusItem(S, "Director's review", ['review'], SearchIcon),
              statusItem(S, 'Under investigation', ['investigation', 'filing'], BoltIcon),
              statusItem(S, 'Closed', ['classified', 'debunked', 'inconclusive'], ArchiveIcon),
              S.divider(),
              S.listItem()
                .id('cases-by-category')
                .title('By category')
                .icon(TagIcon)
                .child(
                  S.list()
                    .id('cases-by-category-list')
                    .title('By category')
                    .items(
                      CATEGORIES.map((c) =>
                        S.listItem()
                          .id(`category-${c.value}`)
                          .title(c.title)
                          .child(caseList(S, c.title, 'category == $category', {category: c.value})),
                      ),
                    ),
                ),
              S.listItem()
                .id('cases-restricted')
                .title('Filed in restricted regions')
                .icon(LockIcon)
                .child(
                  caseList(
                    S,
                    'Restricted regions',
                    'sighting.location.region._ref in *[_type == "region" && restricted == true]._id',
                  ),
                ),
              S.listItem()
                .id('cases-hidden')
                .title('Hidden by moderation')
                .icon(EyeClosedIcon)
                .child(caseList(S, 'Hidden cases', 'hidden == true')),
              S.divider(),
              S.documentTypeListItem('case').title('All cases'),
            ]),
        ),
      S.listItem()
        .id('red-strings')
        .title('Red strings')
        .icon(LinkIcon)
        .child(
          S.list()
            .id('red-strings-list')
            .title('Red strings')
            .items(
              ['proposed', 'confirmed', 'rejected'].map((status) =>
                S.listItem()
                  .id(`strings-${status}`)
                  .title(status.charAt(0).toUpperCase() + status.slice(1))
                  .child(
                    S.documentList()
                      .title(`${status} strings`)
                      .schemaType('connection')
                      .filter('_type == "connection" && status == $status')
                      .params({status})
                      .defaultOrdering(newestFirst),
                  ),
              ),
            ),
        ),
      S.divider(),
      S.documentTypeListItem('subject').title('Subjects').icon(BulbOutlineIcon),
      S.documentTypeListItem('region').title('Regions').icon(PinIcon),
      S.documentTypeListItem('witness').title('Witnesses').icon(UserIcon),
      S.divider(),
      S.listItem()
        .id('bureau-settings')
        .title('Bureau settings')
        .icon(CogIcon)
        .child(
          S.document()
            .schemaType('bureauSettings')
            .documentId(BUREAU_SETTINGS_ID)
            .title('Bureau settings'),
        ),
      // boardPin and counter are machine-written and deliberately not listed.
    ])
