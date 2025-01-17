/*
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * External dependencies
 */
import percySnapshot from '@percy/puppeteer';
import { createNewStory } from '@web-stories-wp/e2e-test-utils';

/**
 * WordPress dependencies
 */
import { activatePlugin, deactivatePlugin } from '@wordpress/e2e-test-utils';

describe('Custom Meta Boxes', () => {
  describe('Unavailable', () => {
    it('should not display button to toggle meta boxes', async () => {
      await createNewStory();
      await expect(page).toMatchElement('input[placeholder="Add title"]');
      await expect(page).not.toMatchElement(
        '[aria-label="Third-Party Meta Boxes"]'
      );
    });
  });

  describe('Available', () => {
    beforeAll(async () => {
      await activatePlugin('web-stories-test-plugin-meta-box');
    });

    afterAll(async () => {
      await deactivatePlugin('web-stories-test-plugin-meta-box');
    });

    it('should display meta boxes and save their content', async () => {
      await createNewStory();

      await expect(page).toMatchElement('input[placeholder="Add title"]');
      await page.type('input[placeholder="Add title"]', 'Meta Box Test');

      await expect(page).not.toMatchElement(
        '#web-stories-editor #web_stories_test_meta_box_field',
        {
          visible: false,
        }
      );

      await expect(page).toClick('[aria-label="Third-Party Meta Boxes"]');

      await expect(page).toMatchElement(
        '#web-stories-editor #web_stories_test_meta_box_field',
        {
          visible: false,
        }
      );
      await page.type(
        '#web_stories_test_meta_box_field',
        'Meta Box Test Value'
      );

      await percySnapshot(page, 'Custom Meta Boxes');

      // Verify that collapsing works via postbox.js from WordPress.

      await expect(page).toClick('button.handlediv[aria-expanded="true"]');
      await expect(page).toMatchElement(
        'button.handlediv[aria-expanded="false"]'
      );

      await expect(page).toClick('button.handlediv[aria-expanded="false"]');
      await expect(page).toMatchElement(
        'button.handlediv[aria-expanded="true"]'
      );

      // Publish story.
      await expect(page).toClick('button', { text: 'Publish' });

      await page.waitForSelector('.ReactModal__Content');
      await expect(page).toClick('button', {
        text: /Continue to publish/,
      });

      await expect(page).toMatchElement('button', { text: 'Dismiss' });

      // Refresh page to verify that the text has been persisted.
      await page.reload();
      await expect(page).toMatchElement('input[placeholder="Add title"]');

      await expect(page).not.toMatchElement(
        '#web-stories-editor #web_stories_test_meta_box_field',
        {
          visible: false,
        }
      );

      await expect(page).toClick('[aria-label="Third-Party Meta Boxes"]');

      await expect(page).toMatchElement(
        '#web-stories-editor #web_stories_test_meta_box_field',
        {
          visible: false,
        }
      );

      const metaBoxValue = await page.evaluate(
        () => document.getElementById('web_stories_test_meta_box_field').value
      );
      await expect(metaBoxValue).toStrictEqual('Meta Box Test Value');
    });
  });
});
