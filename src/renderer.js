'use strict'

const puppeteer = require('puppeteer')
const waitForAnimations = require('./wait-for-animations')

class Renderer {
  constructor(browser) {
    this.browser = browser
  }

  async createPage(url, options = {}) {
    const { timeout, waitUntil, waitFor, waitForSelector, credentials, emulateMedia = 'print' } = options
    const page = await this.browser.newPage()
    if (emulateMedia) {
      await page.emulateMedia(emulateMedia)
    }

    if (credentials) {
      await page.authenticate(credentials)
    }

    await page.goto(url, {
      timeout: Number(timeout) || 30 * 1000,
      waitUntil: waitUntil || 'networkidle2',
    })

    if (waitFor) {
      await page.waitFor(Number(waitFor));
    }

    if (waitForSelector) {
      await page.waitForSelector(waitForSelector);
    }

    return page
  }

  async render(url, options = {}) {
    let page = null
    try {
      page = await this.createPage(url, options)
      const html = await page.content()
      return html
    } finally {
      if (page) {
        await page.close()
      }
    }
  }

  async pdf(url, options = {}) {
    let page = null
    try {
      page = await this.createPage(url, options)

      const { scale = 1.0, displayHeaderFooter, printBackground, landscape, ...restOptions } = options
      const buffer = await page.pdf({
        ...restOptions,
        scale: Number(scale),
        displayHeaderFooter: displayHeaderFooter === 'true',
        printBackground: printBackground === 'true',
        landscape: landscape === 'true',
      })
      return buffer
    } finally {
      if (page) {
        await page.close()
      }
    }
  }

  async screenshot(url, options = {}) {
    let page = null
    try {
      page = await this.createPage(url, options)
      page.setViewport({
        width: Number(options.width || 800),
        height: Number(options.height || 600),
      })

      const { fullPage, omitBackground, screenshotType, quality, ...restOptions } = options
      let screenshotOptions = {
        ...restOptions,
        type: screenshotType || 'png',
        quality:
          Number(quality) || (screenshotType === undefined || screenshotType === 'png' ? 0 : 100),
        fullPage: fullPage === 'true',
        omitBackground: omitBackground === 'true',
      }

      const animationTimeout = Number(options.animationTimeout || 0)
      if (animationTimeout > 0) {
        await waitForAnimations(page, screenshotOptions, animationTimeout)
      }

      const buffer = await page.screenshot(screenshotOptions)
      return {
        screenshotType,
        buffer,
      }
    } finally {
      if (page) {
        await page.close()
      }
    }
  }

  async close() {
    await this.browser.close()
  }
}

async function create(options = {}) {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
    defaultViewport: {
      width: 1280,
      height: 1000,
      deviceScaleFactor: 2,
    },
    ...options,
  })
  return new Renderer(browser)
}

module.exports = create
