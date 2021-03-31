import rp from 'request-promise-native'
import cheerio from 'cheerio'

import { SAMPLE_RESULT_WITHOUT_DATE, SAMPLE_RESULT_WITH_DATE } from './sample_htmls.js'


async function main() {
  const CSRF_TOKEN = 'B4F2F03C5678424B9D87EDAD7E12C1BC'
  const COOKIE = 'ASPSESSIONIDCSDSCCRA=AGKNOKKCCFJGFOHJDFFJELFI; ASPSESSIONIDCSARSTDB=DHHFHKNBADHOIJAPFFMLONCB; ASPSESSIONIDCCTSCADS=GNNLLAOBCDANGKFOKODOHHHD; ASPSESSIONIDAQCTTSCA=PKAGBHOBOMPJPFIGKBBGFGEJ'
  const MONTH = 9

  try {
    // const results = await rp({
    //   uri: `https://evisaforms.state.gov/acs/make_calendar.asp?CSRFToken=${CSRF_TOKEN}&nMonth=${MONTH}&nYear=2021&type=1&servicetype=06&pc=SNJ`,
    //   headers: {
    //     'Connection': 'keep-alive',
    //     'sec-ch-ua': '"Google Chrome";v="89", "Chromium";v="89", ";Not A Brand";v="99"',
    //     'sec-ch-ua-mobile': '?0',
    //     'Upgrade-Insecure-Requests': '1',
    //     'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36',
    //     'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
    //     'Sec-Fetch-Site': 'same-origin',
    //     'Sec-Fetch-Mode': 'navigate',
    //     'Sec-Fetch-User': '?1',
    //     'Sec-Fetch-Dest': 'document',
    //     'Referer': 'https://evisaforms.state.gov/acs/make_calendar.asp?CSRFToken=AD406CCFF7524F7383E13726D05205CD&nMonth=10&nYear=2021&type=1&servicetype=06&pc=SNJ',
    //     'Accept-Language': 'en-US,en;q=0.9,es;q=0.8',
    //     'Cookie': COOKIE,
    //   },
    //   json: true
    // })
    // console.log(results)

    // const $ = cheerio.load(results)
    const $ = cheerio.load(SAMPLE_RESULT_WITHOUT_DATE)
    console.log(!!$('td[bgcolor="#ffffc0"]').text().trim())

    console.log('Success')
  } catch (err) {
    console.log(err)
    console.error('Error', err.statusCode)
  }
}

main()
