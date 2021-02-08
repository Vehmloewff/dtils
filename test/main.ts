import { sh, shCapture, writeText } from '../mod.ts'

const { output } = await shCapture('deno bundle --unstable test/main.ts')

await writeText('test/fixture/bundled.js', output)

sh(`

echo "
// the sh function runs shell code" >> test/fixture/bundled.js

echo "Oh man, that's nice!"

curl https://example.com -o test/fixture/example.com.html

`)
