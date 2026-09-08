import { test, expect } from '@playwright/test';

test('WebKit iPhone-sized reader resumes and retains its read count', async ({page}, testInfo) => {
  await page.setViewportSize({width:390,height:844});
  await page.route(/firebaseio|firebasedatabase/, route=>route.abort());
  await page.goto('./');
  await page.evaluate(async () => {
    const {db} = await import('/phonobuddy/src/utils/storage.js');
    await db.settings.put({key:'readingVoicePreferences',value:{enabled:false}});
  });
  await page.getByRole('button',{name:/Stories/}).first().click();
  await page.getByRole('button',{name:/A Frog in the Pond/}).click();
  await page.getByRole('button',{name:'Next page',exact:true}).click();
  await page.reload();
  await page.getByRole('button',{name:/Stories/}).first().click();
  await page.getByRole('button',{name:/Continue at page 2/}).click();
  await expect(page.getByLabel('Story page 2',{exact:true})).toContainText('fish');
  await page.getByRole('button',{name:'Hear fish',exact:true}).click();
  await expect(page.getByRole('status')).toHaveText("Dad's turn: fish");
  expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({path:testInfo.outputPath('webkit-iphone-reader.png'),fullPage:true});
  for (let i=2;i<6;i++) await page.getByRole('button',{name:'Next page',exact:true}).click();
  await page.getByRole('button',{name:'Finish story',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Story finished'})).toBeVisible();
  await page.getByRole('button',{name:'Back to stories'}).click();
  await expect(page.getByRole('button',{name:/Read 1 time/})).toBeVisible();
});

test('WebKit section choices persist without a recording bank', async ({page},testInfo) => {
  await page.route(/firebaseio|firebasedatabase/, route=>route.abort());
  await page.goto('./');
  await page.getByRole('button',{name:/Year 1 Dino/}).click();
  await page.getByRole('button',{name:'Next section',exact:true}).click();
  await expect(page.getByLabel('Practice point')).toHaveValue('1');
  await page.getByLabel('Auto next section',{exact:true}).check();
  await page.reload();
  await page.getByRole('button',{name:/Year 1 Dino/}).click();
  await expect(page.getByLabel('Practice point')).toHaveValue('1');
  await expect(page.getByLabel('Auto next section',{exact:true})).toBeChecked();
  await expect(page.getByRole('button',{name:/Build today/})).toBeDisabled();
  await page.screenshot({path:testInfo.outputPath('webkit-tablet-map.png'),fullPage:true});
});
