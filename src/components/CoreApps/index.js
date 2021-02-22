import { useDataQuery } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'
import React from 'react'
import AppList from '../AppList'

const coreAppNames = [
    'App Management',
    'Cache Cleaner',
    'Capture',
    'Dashboard',
    'Data Visualizer',
    'Datastore Management',
    'Import/Export',
    'Interpretations',
    'Maintenance',
    'Menu Management',
    'Messaging',
    'Reports',
    'SMS Configuration',
    'Scheduler',
    'Settings',
    'Translations',
    'User Management',
]

const query = {
    coreApps: {
        resource: 'apps',
        params: {
            bundled: true,
        },
    },
    appHub: {
        resource: 'appHub/v1/apps',
    },
}

const CoreApps = () => {
    const { loading, error, data } = useDataQuery(query)

    const overridenCoreApps = data?.coreApps.filter(app => app.bundled)
    const apps = coreAppNames
        .map(coreAppName => {
            const overridenApp = overridenCoreApps?.find(
                a => a.name === coreAppName
            )
            if (overridenApp) {
                return overridenApp
            }
            return {
                name: coreAppName,
                short_name: coreAppName,
                developer: {
                    company: 'DHIS2',
                },
                icons: {},
            }
        })
        .map(app => {
            const appHubId = data?.appHub.find(
                ({ name, developer }) =>
                    name === app.name && developer.organisation === 'DHIS2'
            )?.id
            return {
                ...app,
                appHubId,
            }
        })
    // TODO: Also compare app.version to latest AppHub version
    const appsWithUpdates = apps.filter(app => !app.version && app.appHubId)

    return (
        <AppList
            error={error}
            loading={loading}
            apps={apps}
            appsWithUpdates={appsWithUpdates}
            errorLabel={i18n.t(
                'Something went wrong whilst loading your core apps'
            )}
            updatesAvailableLabel={i18n.t('Core apps with updates available')}
            allAppsLabel={i18n.t('All core apps')}
            searchLabel={i18n.t('Search core apps')}
        />
    )
}

export default CoreApps
