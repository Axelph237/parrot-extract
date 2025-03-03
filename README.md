# \<P>arrot
A simple text extraction tool for chromium.
## Installation
Clone this repository, then open a chromium-based web browser.
Go to `settings > extensions > developer mode` and select `Load unpacked`.
Select the path to the cloned package.
## Usage
When on a page with text elements (specifically `h1`, `h2`, `h3`, `p`), open \<P>arrot and click `Extract Text`.
If you find yourself on a web page with a client loaded DOM or iframe fetched content, find a unique identifier for the element, and use the `Element Selector` input to search for that element. Use `#<selector>` for ids, and `.<selector>` for classnames.
Once text has been extracted, you can use `Copy` to copy all the extracted text to your clipboard.

---
That's all!
