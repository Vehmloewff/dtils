import { sh, shCapture, writeText } from '../mod.ts'

const { output } = await shCapture('deno bundle --unstable test.ts')

await writeText('test/fixture/bundled.js', output)

sh(`

echo "
// the sh function runs shell code" >> test/main.ts

echo "Oh man, that's nice!"

curl https://example.com -o test/fixture/example.com.html

`)

// the sh function runs shell code

// the sh function runs shell code
