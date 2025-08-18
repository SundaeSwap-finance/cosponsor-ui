import axios from 'axios'

// https://docs.gov.tools/participate-in-development/govtool-apis/proposal-pillar-api/access
const API_BASE_URL_MAIN = 'https://be.pdf.gov.tools/api/'
const API_BASE_URL_PREVIEW = 'https://p1337-zdae9891f-zf09d11da-gtw.z937eb260.rustrocks.fr/api/'

const govToolsApi = axios.create({
  baseURL: API_BASE_URL_PREVIEW,
  timeout: 5000,
  headers: { 'Content-Type': 'application/json' },
})

export default govToolsApi
