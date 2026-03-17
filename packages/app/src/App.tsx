import { Navigate, Route } from 'react-router-dom';
import { apiDocsPlugin, ApiExplorerPage } from '@backstage/plugin-api-docs';
import {
  CatalogEntityPage,
  CatalogIndexPage,
  catalogPlugin,
} from '@backstage/plugin-catalog';
import {
  CatalogImportPage,
  catalogImportPlugin,
} from '@backstage/plugin-catalog-import';
import { ScaffolderPage, scaffolderPlugin } from '@backstage/plugin-scaffolder';
import { orgPlugin } from '@backstage/plugin-org';
import { SearchPage } from '@backstage/plugin-search';
import {
  TechDocsIndexPage,
  techdocsPlugin,
  TechDocsReaderPage,
} from '@backstage/plugin-techdocs';
import { TechDocsAddons } from '@backstage/plugin-techdocs-react';
import { ReportIssue } from '@backstage/plugin-techdocs-module-addons-contrib';
import { UserSettingsPage } from '@backstage/plugin-user-settings';
import { apis } from './apis';
import { entityPage } from './components/catalog/EntityPage';
import { searchPage } from './components/search/SearchPage';
import { Root } from './components/Root';

import {
  AlertDisplay,
  OAuthRequestDialog,
  SignInPage,
} from '@backstage/core-components';
import { createApp } from '@backstage/app-defaults';
import { AppRouter, FlatRoutes } from '@backstage/core-app-api';
import { githubAuthApiRef } from '@backstage/core-plugin-api';
import { CatalogGraphPage } from '@backstage/plugin-catalog-graph';
import { RequirePermission } from '@backstage/plugin-permission-react';
import { catalogEntityCreatePermission } from '@backstage/plugin-catalog-common/alpha';
import { NotificationsPage } from '@backstage/plugin-notifications';
import { SignalsDisplay } from '@backstage/plugin-signals';

// CoreLock Theme
import {
  UnifiedThemeProvider,
  themes,
  createUnifiedTheme,
  genPageTheme,
  shapes,
} from '@backstage/theme';
import LightIcon from '@material-ui/icons/WbSunny';
import DarkIcon from '@material-ui/icons/Brightness2';

// CoreLock Dark Theme - extends Backstage dark theme
const corelockDarkTheme = createUnifiedTheme({
  palette: {
    ...themes.dark.getTheme('v5')?.palette,
    primary: {
      main: '#00D4FF',
    },
    secondary: {
      main: '#00D4FF',
    },
    error: {
      main: '#FF5370',
    },
    warning: {
      main: '#FFCB6B',
    },
    success: {
      main: '#00E676',
    },
    background: {
      default: '#0A1628',
      paper: '#112240',
    },
    navigation: {
      background: '#0D2137',
      indicator: '#00D4FF',
      color: '#8892B0',
      selectedColor: '#FFFFFF',
      navItem: {
        hoverBackground: 'rgba(0, 212, 255, 0.08)',
      },
    },
  },
  defaultPageTheme: 'home',
  pageTheme: {
    home: genPageTheme({
      colors: ['#0A1628', '#0D2137'],
      shape: shapes.wave,
    }),
    documentation: genPageTheme({
      colors: ['#0D2137', '#112240'],
      shape: shapes.wave2,
    }),
    tool: genPageTheme({
      colors: ['#0A1628', '#112240'],
      shape: shapes.round,
    }),
    service: genPageTheme({
      colors: ['#0D2137', '#0A1628'],
      shape: shapes.wave,
    }),
    website: genPageTheme({
      colors: ['#0A1628', '#0D2137'],
      shape: shapes.wave,
    }),
    library: genPageTheme({
      colors: ['#112240', '#0D2137'],
      shape: shapes.wave,
    }),
    other: genPageTheme({
      colors: ['#0A1628', '#112240'],
      shape: shapes.wave,
    }),
    app: genPageTheme({
      colors: ['#0D2137', '#0A1628'],
      shape: shapes.wave,
    }),
  },
});

// CoreLock Light Theme - extends Backstage light theme
const corelockLightTheme = createUnifiedTheme({
  palette: {
    ...themes.light.getTheme('v5')?.palette,
    primary: {
      main: '#0D2137',
    },
    secondary: {
      main: '#00A8CC',
    },
    navigation: {
      background: '#0D2137',
      indicator: '#00D4FF',
      color: '#8892B0',
      selectedColor: '#FFFFFF',
      navItem: {
        hoverBackground: 'rgba(0, 212, 255, 0.08)',
      },
    },
  },
  defaultPageTheme: 'home',
  pageTheme: {
    home: genPageTheme({
      colors: ['#0D2137', '#112240'],
      shape: shapes.wave,
    }),
    documentation: genPageTheme({
      colors: ['#112240', '#1A3356'],
      shape: shapes.wave2,
    }),
    tool: genPageTheme({
      colors: ['#0D2137', '#112240'],
      shape: shapes.round,
    }),
    service: genPageTheme({
      colors: ['#0A1628', '#0D2137'],
      shape: shapes.wave,
    }),
    website: genPageTheme({
      colors: ['#0D2137', '#0A1628'],
      shape: shapes.wave,
    }),
    library: genPageTheme({
      colors: ['#112240', '#0D2137'],
      shape: shapes.wave,
    }),
    other: genPageTheme({
      colors: ['#0D2137', '#112240'],
      shape: shapes.wave,
    }),
    app: genPageTheme({
      colors: ['#0A1628', '#0D2137'],
      shape: shapes.wave,
    }),
  },
});

const app = createApp({
  apis,
  bindRoutes({ bind }) {
    bind(catalogPlugin.externalRoutes, {
      createComponent: scaffolderPlugin.routes.root,
      viewTechDoc: techdocsPlugin.routes.docRoot,
      createFromTemplate: scaffolderPlugin.routes.selectedTemplate,
    });
    bind(apiDocsPlugin.externalRoutes, {
      registerApi: catalogImportPlugin.routes.importPage,
    });
    bind(scaffolderPlugin.externalRoutes, {
      registerComponent: catalogImportPlugin.routes.importPage,
      viewTechDoc: techdocsPlugin.routes.docRoot,
    });
    bind(orgPlugin.externalRoutes, {
      catalogIndex: catalogPlugin.routes.catalogIndex,
    });
  },
  themes: [
    {
      id: 'corelock-dark',
      title: 'CoreLock Dark',
      variant: 'dark',
      icon: <DarkIcon />,
      Provider: ({ children }) => (
        <UnifiedThemeProvider theme={corelockDarkTheme}>
          {children}
        </UnifiedThemeProvider>
      ),
    },
    {
      id: 'corelock-light',
      title: 'CoreLock Light',
      variant: 'light',
      icon: <LightIcon />,
      Provider: ({ children }) => (
        <UnifiedThemeProvider theme={corelockLightTheme}>
          {children}
        </UnifiedThemeProvider>
      ),
    },
  ],
  components: {
    SignInPage: props => (
      <SignInPage
        {...props}
        providers={[
          {
            id: 'github-auth-provider',
            title: 'GitHub',
            message: 'Sign in using GitHub',
            apiRef: githubAuthApiRef,
          },
          'guest',
        ]}
      />
    ),
  },
});

const routes = (
  <FlatRoutes>
    <Route path="/" element={<Navigate to="catalog" />} />
    <Route path="/catalog" element={<CatalogIndexPage />} />
    <Route
      path="/catalog/:namespace/:kind/:name"
      element={<CatalogEntityPage />}
    >
      {entityPage}
    </Route>
    <Route path="/docs" element={<TechDocsIndexPage />} />
    <Route
      path="/docs/:namespace/:kind/:name/*"
      element={<TechDocsReaderPage />}
    >
      <TechDocsAddons>
        <ReportIssue />
      </TechDocsAddons>
    </Route>
    <Route path="/create" element={<ScaffolderPage />} />
    <Route path="/api-docs" element={<ApiExplorerPage />} />
    <Route
      path="/catalog-import"
      element={
        <RequirePermission permission={catalogEntityCreatePermission}>
          <CatalogImportPage />
        </RequirePermission>
      }
    />
    <Route path="/search" element={<SearchPage />}>
      {searchPage}
    </Route>
    <Route path="/settings" element={<UserSettingsPage />} />
    <Route path="/catalog-graph" element={<CatalogGraphPage />} />
    <Route path="/notifications" element={<NotificationsPage />} />
  </FlatRoutes>
);

export default app.createRoot(
  <>
    <AlertDisplay />
    <OAuthRequestDialog />
    <SignalsDisplay />
    <AppRouter>
      <Root>{routes}</Root>
    </AppRouter>
  </>,
);
