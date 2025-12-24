import { withI18n } from '~/lib/i18n/with-i18n';

import { SparloHero } from './_components/sparlo-hero';

function Home() {
  return <SparloHero />;
}

export default withI18n(Home);
