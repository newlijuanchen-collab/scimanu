import { redirect } from 'next/navigation'
import { routing } from '@/i18n/routing'

export default function BiomedicalStatisticsAlias({ params }: { params: { locale: string } }) {
  const prefix = params.locale === routing.defaultLocale ? '' : `/${params.locale}`
  redirect(`${prefix}/statistics?source=pubmed_biomed&window=6m&type=all`)
}
