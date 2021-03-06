import { expect } from "chai";
import mockFs from "mock-fs";
import nock from "nock";
import { FsParser, SubParser, SubResolver, UrlResolver } from "../../src";
import "../utils/setup";
import { defaultContext } from "./utils";

describe("UrlResolver", function() {
  let instance: SubResolver;
  let contentsResolver: SubParser<string>;

  before(function() {
    nock.disableNetConnect();
    contentsResolver = FsParser();
  });

  beforeEach(function() {
    instance = UrlResolver();
  });

  afterEach(function() {
    mockFs.restore();
    expect(nock.isDone()).to.be.true;
  });

  it("returns null on non-urls", async function() {
    mockFs({
      "relative/path.file": "wrong",
    });

    expect(await instance("relative/path.file", defaultContext())).to.be.null;
  });

  it("downloads the file", async function() {
    const CONTENTS = "<HTML><HEAD><TITLE>Success</TITLE></HEAD><BODY>Success</BODY></HTML>\n";
    nock("http://captive.apple.com:80")
      .get("/")
      .reply(200, CONTENTS);

    const path = await instance("http://captive.apple.com/", defaultContext());
    expect(path).to.not.be.null;
    expect(await contentsResolver(path!)).to.be.equal(CONTENTS);
  });

  it("throws on network error", async function() {
    const ERROR = "test error";
    nock("http://somewebsite.com:80")
      .get("/")
      .replyWithError(ERROR);

    await expect(instance("http://somewebsite.com", defaultContext())).to.eventually.be.rejectedWith(ERROR);
  });

  it("throws on failure code", async function() {
    nock("http://somewebsite.com:80")
      .get("/")
      .reply(404);

    await expect(instance("http://somewebsite.com", defaultContext())).to.eventually.be.rejected;
  });
});
