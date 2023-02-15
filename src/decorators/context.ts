/*
 * @japa/browser-client
 *
 * (c) Japa.dev
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type { BasePage } from '../base_page'
import type { Page } from '../../modules/playwright'
import type { Decorator, VisitOptions } from '../types'

/**
 * Types for custom methods
 */
declare module '../../modules/playwright' {
  export interface BrowserContext {
    /**
     * Open a new page and visit a URL
     */
    visit(url: string, options?: VisitOptions): Promise<Page>

    /**
     * Open a new page using a page model
     */
    visit<PageModel extends typeof BasePage>(page: PageModel): Promise<InstanceType<PageModel>>

    /**
     * Open a new page using a page model and access it's
     * instance inside the callback.
     */
    visit<PageModel extends typeof BasePage>(
      page: PageModel,
      callback: (page: InstanceType<PageModel>) => void | Promise<void>
    ): Promise<void>
  }
}

/**
 * Decorates the context with the visit method.
 */
export const addVisitMethod: Decorator = {
  context(context) {
    context.visit = async function <PageModel extends typeof BasePage>(
      UrlOrPage: string | PageModel,
      callbackOrOptions?: ((page: InstanceType<PageModel>) => void | Promise<void>) | VisitOptions
    ): Promise<void | InstanceType<PageModel> | Page> {
      const page = await context.newPage()

      /**
       * If Url is a string, then visit the page
       * and return value
       */
      if (typeof UrlOrPage === 'string') {
        await page.goto(UrlOrPage, typeof callbackOrOptions !== 'function' ? callbackOrOptions : {})
        return page
      }

      /**
       * Create an instance of the page model
       */
      const pageInstance = new UrlOrPage(page, context)

      /**
       * Visit the url of the base model
       */
      await page.goto(pageInstance.url, pageInstance.visitOptions)

      /**
       * Invoke callback if exists
       */
      if (typeof callbackOrOptions === 'function') {
        await callbackOrOptions(pageInstance as InstanceType<PageModel>)
        return
      }

      /**
       * Otherwise return the page instance back
       */
      return pageInstance as InstanceType<PageModel>
    }
  },
}
