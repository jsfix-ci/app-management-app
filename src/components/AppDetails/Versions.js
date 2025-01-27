import { useAlert, useConfig } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'
import { PropTypes } from '@dhis2/prop-types'
import {
    Checkbox,
    Button,
    Table,
    TableHead,
    TableRowHead,
    TableCellHead,
    TableBody,
    TableRow,
    TableCell,
} from '@dhis2/ui'
import moment from 'moment'
import React, { useState } from 'react'
import semver from 'semver'
import { useApi } from '../../api.js'
import styles from './AppDetails.module.css'
import { channelToDisplayName } from './channel-to-display-name.js'

const ChannelCheckbox = ({
    name,
    label,
    channelsFilter,
    setChannelsFilter,
}) => {
    const handleChange = ({ checked }) => {
        const newState = new Set(channelsFilter)
        if (checked) {
            newState.add(name)
        } else {
            newState.delete(name)
        }
        setChannelsFilter(newState)
    }

    return (
        <div className={styles.channelCheckbox}>
            <Checkbox
                checked={channelsFilter.has(name)}
                disabled={channelsFilter.size === 1 && channelsFilter.has(name)}
                onChange={handleChange}
                label={label}
            />
        </div>
    )
}

ChannelCheckbox.propTypes = {
    channelsFilter: PropTypes.object.isRequired,
    label: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    setChannelsFilter: PropTypes.func.isRequired,
}

const ChannelsFilter = ({ versions, channelsFilter, setChannelsFilter }) => {
    const hasChannel = (channel) => versions.some((v) => v.channel === channel)
    const channels = Object.keys(channelToDisplayName).filter(hasChannel)

    if (channels.length <= 1) {
        return null
    }

    return (
        <div className={styles.versionsFilters}>
            <h3 className={styles.sectionSubheader}>
                {i18n.t('Channel', { context: 'AppHub release channel' })}
            </h3>
            {channels.map((name) => (
                <ChannelCheckbox
                    key={name}
                    name={name}
                    label={channelToDisplayName[name]}
                    channelsFilter={channelsFilter}
                    setChannelsFilter={setChannelsFilter}
                />
            ))}
        </div>
    )
}

ChannelsFilter.propTypes = {
    channelsFilter: PropTypes.object.isRequired,
    setChannelsFilter: PropTypes.func.isRequired,
    versions: PropTypes.array.isRequired,
}

const VersionsTable = ({ installedVersion, versions, onVersionInstall }) => (
    <Table>
        <TableHead>
            <TableRowHead>
                <TableCellHead>{i18n.t('Version')}</TableCellHead>
                <TableCellHead>
                    {i18n.t('Channel', {
                        context: 'AppHub release channel',
                    })}
                </TableCellHead>
                <TableCellHead>{i18n.t('Upload date')}</TableCellHead>
                <TableCellHead></TableCellHead>
            </TableRowHead>
        </TableHead>
        <TableBody>
            {versions.map((version) => (
                <TableRow key={version.id}>
                    <TableCell>{version.version}</TableCell>
                    <TableCell>
                        {channelToDisplayName[version.channel]}
                    </TableCell>
                    <TableCell>{moment(version.created).format('L')}</TableCell>
                    <TableCell>
                        <Button
                            small
                            secondary
                            className={styles.installBtn}
                            disabled={version.version === installedVersion}
                            onClick={() => onVersionInstall(version)}
                        >
                            {version.version === installedVersion
                                ? i18n.t('Installed')
                                : i18n.t('Install')}
                        </Button>
                        <a
                            download
                            href={version.downloadUrl}
                            className={styles.downloadLink}
                        >
                            <Button small secondary>
                                {i18n.t('Download')}
                            </Button>
                        </a>
                    </TableCell>
                </TableRow>
            ))}
        </TableBody>
    </Table>
)

VersionsTable.propTypes = {
    versions: PropTypes.array.isRequired,
    onVersionInstall: PropTypes.func.isRequired,
    installedVersion: PropTypes.string,
}

export const Versions = ({ installedVersion, versions, onVersionInstall }) => {
    const [channelsFilter, setChannelsFilter] = useState(new Set(['stable']))
    const installSuccessAlert = useAlert(i18n.t('App installed successfully'), {
        success: true,
    })
    const installErrorAlert = useAlert(
        ({ error }) =>
            i18n.t('Failed to install app: {{errorMessage}}', {
                errorMessage: error.message,
                nsSeparator: '-:-',
            }),
        { critical: true }
    )
    const { serverVersion } = useConfig()
    const { installVersion } = useApi()
    const dhisVersion = semver.coerce(
        `${serverVersion.major}.${serverVersion.minor}`
    )
    const satisfiesDhisVersion = (version) => {
        const { minDhisVersion: min, maxDhisVersion: max } = version
        if (!min && !max) {
            return true
        } else if (min && max) {
            const range = new semver.Range(`${min} - ${max}`)
            return semver.satisfies(dhisVersion, range)
        } else if (!min && max) {
            const range = new semver.Range(`<=${max}`)
            return semver.satisfies(dhisVersion, range)
        } else if (min && !max) {
            const range = new semver.Range(`>=${min}`)
            return semver.satisfies(dhisVersion, range)
        }
    }
    const filteredVersions = versions
        .filter((version) => channelsFilter.has(version.channel))
        .filter(satisfiesDhisVersion)
    const handleVersionInstall = async (version) => {
        try {
            await installVersion(version.id)
            installSuccessAlert.show()
            onVersionInstall()
        } catch (error) {
            installErrorAlert.show({ error })
        }
    }

    return (
        <div className={styles.versionsContainer}>
            <ChannelsFilter
                versions={versions}
                channelsFilter={channelsFilter}
                setChannelsFilter={setChannelsFilter}
            />
            {filteredVersions.length > 0 ? (
                <VersionsTable
                    installedVersion={installedVersion}
                    versions={filteredVersions}
                    onVersionInstall={handleVersionInstall}
                />
            ) : (
                <em>
                    {i18n.t(
                        'There are no compatible versions matching your criteria'
                    )}
                </em>
            )}
        </div>
    )
}

Versions.propTypes = {
    versions: PropTypes.array.isRequired,
    onVersionInstall: PropTypes.func.isRequired,
    installedVersion: PropTypes.string,
}
