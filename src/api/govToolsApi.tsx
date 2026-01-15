import axios from 'axios'

// https://docs.gov.tools/participate-in-development/govtool-apis/proposal-pillar-api/access
const API_BASE_URL_MAINNET = 'https://be.pdf.gov.tools/api/'
const API_BASE_URL_PREVIEW = 'https://p1337-zdae9891f-zf09d11da-gtw.z937eb260.rustrocks.fr/api/'

// Use COSPONSOR_APP_ENV to determine which API to use
const isPreview = import.meta.env.COSPONSOR_APP_ENV === 'preview'
const API_BASE_URL = isPreview ? API_BASE_URL_PREVIEW : API_BASE_URL_MAINNET

const govToolsApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

export default govToolsApi
