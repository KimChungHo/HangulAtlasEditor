/*
    This source code is depends on parse-bmfont-xml.
*/
const parseBmfontXml = require('parse-bmfont-xml');

let HangulAtlasEditor = function() { HangulAtlasEditor.Initialize(); };

window.addEventListener('load', HangulAtlasEditor.bind(HangulAtlasEditor) );

HangulAtlasEditor.AlphabetType = {
    None:      -1,
    Consonant:  0,
    Vowel:      1
};

HangulAtlasEditor.RENDER_SPEED = 16;
HangulAtlasEditor.RENDER_STEP  = 10;

HangulAtlasEditor.UNICODE_CONSONANTS = "ㄱㄲㄳㄴㄵㄶㄷㄸㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅃㅄㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ";
HangulAtlasEditor.UNICODE_VOWELS     = "ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ";

HangulAtlasEditor.UNICODE_ALPHABETS = HangulAtlasEditor.UNICODE_CONSONANTS + HangulAtlasEditor.UNICODE_VOWELS;
HangulAtlasEditor.UNICODE_ALPHABET_START = 0x3131;
HangulAtlasEditor.UNICODE_ALPHABET_END   = 0x318F;

HangulAtlasEditor.UNICODE_START          = 0xAC00;
HangulAtlasEditor.UNICODE_END            = 0xD7A3;

HangulAtlasEditor.UNICODE_HEAD_RANGE     = 0x024C;
HangulAtlasEditor.UNICODE_HEADS = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ";

HangulAtlasEditor.UNICODE_BODY_RANGE     = 0x001C;
HangulAtlasEditor.UNICODE_BODIES = "ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ";

HangulAtlasEditor.UNICODE_TAILS = "ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ";

HangulAtlasEditor.DKB_HORIZONTAL_LINE = 30;
HangulAtlasEditor.DKB_VERTICAL_LINE   = 18;

HangulAtlasEditor.DKB_TABLE = {
    
    ALPHABET: {
        LINE_OFFSET: 0,
        CHARSET: [
            HangulAtlasEditor.UNICODE_CONSONANTS,
            HangulAtlasEditor.UNICODE_VOWELS
        ]
    },
    
    WITHOUT_TAIL: {
        
        HEAD: {
            LINE_OFFSET: 2,
            CHARSET: [
                "ㅏㅐㅑㅒㅓㅔㅕㅖㅣ",
                "ㅗㅛㅡ",
                "ㅜㅠ",
                "ㅘㅙㅚㅢ",
                "ㅝㅞㅟ"
            ]
        },
        
        BODY: {
            LINE_OFFSET: 10,
            CHARSET: [
                "ㄱㅋ",
                "ㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅌㅍㅎ"
            ]
        }
    },
    
    WITH_TAIL: {
        
        HEAD: {
            LINE_OFFSET: 7,
            CHARSET: [
                "ㅏㅐㅑㅒㅓㅔㅕㅖㅣ",
                "ㅗㅛㅜㅠㅡ",
                "ㅘㅙㅚㅢㅝㅞㅟ"
            ]
        },
        
        BODY: {
            LINE_OFFSET: 12,
            CHARSET: [
                "ㄱㅋ",
                "ㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅌㅍㅎ"
            ]
        },
        
        TAIL: {
            LINE_OFFSET: 14,
            CHARSET: [
                "ㅏㅑㅘ",
                "ㅓㅕㅚㅝㅟㅢㅣ",
                "ㅐㅒㅔㅖㅙㅞ",
                "ㅗㅛㅜㅠㅡ"
            ]
        }
    }
};

HangulAtlasEditor.Initialize = function(timeout) {
    
    if (typeof Rect === 'undefined' ||
        typeof Node === 'undefined') {
        
        alert(Strings.HAE.FAILED_TO_LOAD_DEPENDENCIES);
        return;
    }
    
    this.DKBTexture         = null;
    this.DKBHorizontalUnit  = 0;
    this.DKBVerticalUnit    = 0;
    this.IsDKBTextureLoaded = false;
    
    this.FntAtlasTextures = null;
    this.IsFntAtlasTexturesLoaded = false;
    
    this.FntData = null;
    this.IsFntDataLoaded = false;
    
    this.Views = {};
    this.Views.FontAtlasPreview = null;
};

HangulAtlasEditor.GetGlyph = function(glyph) {
    
    var code = glyph.charCodeAt(0);
    
    var head;
    
    if (code <= this.UNICODE_ALPHABET_END) {
        
        if ((head = this.UNICODE_CONSONANTS.indexOf(glyph)) !== -1)
            return [false, head];
        
        if ((head = this.UNICODE_VOWELS.indexOf(glyph)) !== -1)
            return [true, head];
    }
    
    code -= this.UNICODE_START;
    
    var head = Math.floor(code / (this.UNICODE_HEAD_RANGE));
    var body = Math.floor(code / (this.UNICODE_BODY_RANGE) % HangulAtlasEditor.UNICODE_BODIES.length);
    var tail = code % this.UNICODE_BODY_RANGE;
    
    if (tail === 0)
        return [head, body];
    
    tail -= 1;
    
    return [head, body, tail];
};

HangulAtlasEditor.GetGlyphString = function(glyph) {
    
    return this.ToGlyphString(this.GetGlyph(glyph));
};

HangulAtlasEditor.ToGlyphString = function(glyph) {
    
    if (typeof glyph[0] === 'boolean')
        return [
            glyph[0] ? 
            this.UNICODE_VOWELS.charAt(glyph[1]) :
            this.UNICODE_CONSONANTS.charAt(glyph[1])
        ];
    
    else if (glyph.length === 2)
        return [
            this.UNICODE_HEADS.charAt(glyph[0]),
            this.UNICODE_BODIES.charAt(glyph[1])
        ];
    
    else if (glyph.length === 3)
        return [
            this.UNICODE_HEADS.charAt(glyph[0]),
            this.UNICODE_BODIES.charAt(glyph[1]),
            this.UNICODE_TAILS.charAt(glyph[2])
        ];
};

HangulAtlasEditor.ClearFntAtlasTexture = function() {
    
    this.FntAtlasTextures = null;
    this.IsFntAtlasTexturesLoaded = false;
};

HangulAtlasEditor.AddFntAtlasTexture = function(pageKey, image) {
    
    if (!image || image.src === '' || image.width === 0 || image.height === 0)
        return;
    
    this.FntAtlasTextures = this.FntAtlasTextures || {};
    this.FntAtlasTextures[pageKey] = image;
    
    if (!this.FntData) {
        
        this.IsFntAtlasTexturesLoaded = false;
        return;
    }
    
    for (var key of this.FntData.pages)
    if (!(key in this.FntAtlasTextures)) {
        
        this.IsFntAtlasTexturesLoaded = false;
        return;
    }
    
    this.IsFntAtlasTexturesLoaded = true;
    
};

HangulAtlasEditor.LoadFntXml = function(data) {
    
    try {
        
        this.FntData = parseBmfontXml(data);
        
    } catch (e) {
        
        alert(Strings.HAE.NOT_VALID_FNT);
        return;
    }
    
    this.IsFntDataLoaded = true;
};

HangulAtlasEditor.SetDKBAtlasTexture = function(image) {
    
    if (!image || image.src === '' || image.width === 0 || image.height === 0)
        return;
    
    if (image.width % this.DKB_HORIZONTAL_LINE !== 0 ||
        image.height % this.DKB_VERTICAL_LINE !== 0) {
        
        alert(Strings.HAE.DKB_TEXTURE_SIZE_NOT_MATCH);
        return;
    }
    
    this.DKBTexture = image;
    this.DKBHorizontalUnit = image.width  / this.DKB_HORIZONTAL_LINE;
    this.DKBVerticalUnit   = image.height / this.DKB_VERTICAL_LINE;
    
    this.IsDKBTextureLoaded = true;
};

HangulAtlasEditor.DrawGlyph = function(x, y, glyph) {
    
    if (!this.IsDKBTextureLoaded)
        return;
    
    glyph = this.GetGlyph(glyph);
    var glyphString = this.ToGlyphString(glyph);
    
    var atlasData = this.GetDKBAtlasData(glyph, glyphString);
    var context = this.Views.FontAtlasPreview.Context;
    
    for (var offset of atlasData) {
        
        context.drawImage(
            
            //Source
            this.DKBTexture,
            
            //Column, Row
            this.DKBHorizontalUnit * offset[1], this.DKBVerticalUnit * offset[0],
            this.DKBHorizontalUnit,             this.DKBVerticalUnit,
            
            //Destination coordinate
            x, y, this.DKBHorizontalUnit, this.DKBVerticalUnit
        );
    }
};

HangulAtlasEditor.GetDKBAtlasData = function(glyphData, glyphStringData) {
    
    var head, body, tail;
    
    switch (glyphData.length) {
        
        case 2:
            
            if (typeof glyphData[0] === 'boolean') {
                
                //자음, 모음만 있는 경우
                
                head = this.GetDKBLine(this.DKB_TABLE.ALPHABET, glyphStringData[0]);
                
                return [[head, glyphData[1]]];
            }
            
            //받침 종성이 없는 경우
            
            head = this.GetDKBLine(this.DKB_TABLE.WITHOUT_TAIL.HEAD, glyphStringData[1]);
            body = this.GetDKBLine(this.DKB_TABLE.WITHOUT_TAIL.BODY, glyphStringData[0]);
            
            return [[head, glyphData[0]], [body, glyphData[1]]];
            
        case 3:
        
            //받침 종성이 있는 경우
            
            head = this.GetDKBLine(this.DKB_TABLE.WITH_TAIL.HEAD, glyphStringData[1]);
            body = this.GetDKBLine(this.DKB_TABLE.WITH_TAIL.BODY, glyphStringData[0]);
            tail = this.GetDKBLine(this.DKB_TABLE.WITH_TAIL.TAIL, glyphStringData[1]);
            
            return [[head, glyphData[0]], [body, glyphData[1]], [tail, glyphData[2]]];
        
        default: return null;
    }
};

HangulAtlasEditor.GetDKBLine = function(bulset, glyphPart) {
    
    var charset = bulset.CHARSET;
    var index;
    
    for (index = 0; index < charset.length; index++) {
        
        if (charset[index].indexOf(glyphPart) !== -1) {
            
            index += bulset.LINE_OFFSET;
            break;
        }
    }
    
    return index;
};

HangulAtlasEditor.GenerateFnt = function({
        sizeLevel,
        fileName,
        offset,
        xAdvance,
        progress,
        pageCreated,
        done,
        error
    }) {
    
    if (!HangulAtlasEditor.IsDKBTextureLoaded ||
        !HangulAtlasEditor.IsFntAtlasTexturesLoaded ||
        !HangulAtlasEditor.IsFntDataLoaded) {
        
        alert(Strings.HAE.REQUIRED_ASSETS_NOT_LOADED);
        return false;
    }
    
    try {
    
        if (typeof sizeLevel === 'undefined')
            sizeLevel = 2;
        
        else if (typeof sizeLevel === 'string')
            sizeLevel = parseInt(sizeLevel);
        
        sizeLevel += 8;
        
        if (sizeLevel < 7)
            sizeLevel = 7;
        
        if (sizeLevel > 13)
            sizeLevel = 13;
        
        sizeLevel = Math.pow(2, sizeLevel);
        
        var data = {};
        
        data.events = {
            progress:    progress,
            pageCreated: pageCreated,
            done:        done,
            error:       error
        };
        
        data.sizeLevel = sizeLevel;
        data.fileName  = fileName;
        
        offset = offset || {
            x: 0,
            y: 0
        };
        
        data.offset   = offset;
        data.xAdvance = xAdvance;
        
        data.view = this.Views.FontAtlasPreview;
        
        if (data.view)
            document.body.removeChild(view.Element)
        
        data.chars    = this.FntData.chars;
        data.common   = this.FntData.common;
        data.info     = this.FntData.info;
        data.kernings = this.FntData.kernings;
        data.pages    = this.FntData.pages;
        
        //padding order is clockwise from top. [up, right, down, left]
        data.fullSpaceWidth  = data.info.padding[1] + data.info.padding[3] + data.info.spacing[0] + (data.info.spacing[0] % 2);
        data.fullSpaceHeight = data.info.padding[0] + data.info.padding[2] + data.info.spacing[1] + (data.info.spacing[1] % 2);
        
        data.charResult = this.CopyObjectRecursive(data.chars);
        data.pageResult = [];
        
        data.result = {
            common: this.CopyObjectRecursive(data.common),
            info: this.CopyObjectRecursive(data.info),
            kernings: this.CopyObjectRecursive(data.kernings)
        };
        
        data.common.scaleW = sizeLevel;
        data.common.scaleH = sizeLevel;
        
        data.currentPage   = new Node(new Rect(0, 0, sizeLevel, sizeLevel));
        data.currentCanvas = new CanvasView(sizeLevel, sizeLevel);
        data.currentPageIndex = 0;
        
        data.charInfo;
        data.charInfoResult;
        data.charCode;
        data.insertedRect;
        
        data.glyph = null;
        data.glyphString = null;
        data.atlasData = null;
        
        data.drawInfos = null;
        
        data.isKorean = false;
        
        if (data.events.pageCreated)
            data.events.pageCreated(data.currentPage, data.currentCanvas);
        
        if (data.events.progress)
            data.events.progress(0, '-'.charCodeAt(0));
        
        setTimeout(this.DrawFntGlyph.bind(this, data), HangulAtlasEditor.RENDER_SPEED * 10);
        
        return true;
    }
    catch (e) {
        
        if (error)
            error(e);
        
        return false;
    }
};

HangulAtlasEditor.DrawFntGlyph = function(data, index) {
    
    try {
        
        if (!index)
            index = 0;
        
        if (index < data.chars.length) {
            
            for (var step = 0; step < this.RENDER_STEP; step++) {
                
                if (index >= data.chars.length)
                    break;
                
                if (!data.drawInfos) {
                    
                    data.charInfo       = data.chars[index];
                    data.charInfoResult = data.charResult[index];
                    data.isKoreanFontData = null;
                    
                    data.charCode = data.charInfo.id;
                    
                    data.isKorean = data.charCode >= this.UNICODE_ALPHABET_START &&
                                    data.charCode <= this.UNICODE_ALPHABET_END &&
                                    this.GetAlphabetType(data.charCode) !== this.AlphabetType.None;
                    
                    if (!data.isKorean)
                        data.isKorean = data.charCode >= this.UNICODE_START && data.charCode <= this.UNICODE_END;
                    
                    if (data.isKorean) {
                        
                        data.glyph       = this.GetGlyph(String.fromCharCode(data.charInfo.id));
                        data.glyphString = this.ToGlyphString(data.glyph);
                        
                        data.atlasData   = this.GetDKBAtlasData(data.glyph, data.glyphString);
                        
                        data.drawInfos = [];
                        
                        for (var offset of data.atlasData) {
                            
                            if (typeof offset !== 'object')
                                continue;
                            
                            data.drawInfos.push({
                                
                                x: this.DKBHorizontalUnit * offset[1],
                                y: this.DKBVerticalUnit   * offset[0],
                                width:  this.DKBHorizontalUnit,
                                height: this.DKBVerticalUnit,
                                
                                texture: this.DKBTexture
                            });
                        }
                        
                        data.isKoreanFontData = true;
                        
                    } else {
                        
                        data.drawInfos = [{
                            x: data.charInfo.x,
                            y: data.charInfo.y,
                            
                            width:  data.charInfo.width,
                            height: data.charInfo.height,
                            
                            texture: this.FntAtlasTextures[data.pages[data.charInfo.page]]
                        }];
                    }
                }
                
                data.insertedRect = data.currentPage.insert_rect(
                    new Rect(
                        0, 0,
                        data.drawInfos[0].width  + data.fullSpaceWidth,
                        data.drawInfos[0].height + data.fullSpaceHeight
                    )
                );
                
                if (data.insertedRect) {
                    
                    data.insertedRect = data.insertedRect.rect;
                    
                    for (var drawInfo of data.drawInfos)
                        data.currentCanvas.Context.drawImage(
                            
                            //Source
                            drawInfo.texture,
                            
                            //source x, y, width, height
                            drawInfo.x,     drawInfo.y,
                            drawInfo.width, drawInfo.height,
                            
                            //Destination coordinate
                            data.insertedRect.x + data.info.spacing[0] + (data.info.spacing[0] % 2) + data.info.padding[3],
                            data.insertedRect.y + data.info.spacing[1] + (data.info.spacing[1] % 2) + data.info.padding[0],
                            drawInfo.width, drawInfo.height
                        );
                    
                    data.charInfoResult.x      = data.insertedRect.x + data.info.spacing[0] + (data.info.spacing[0] % 2) + data.info.padding[3];
                    data.charInfoResult.y      = data.insertedRect.y + data.info.spacing[1] + (data.info.spacing[1] % 2) + data.info.padding[0];
                    data.charInfoResult.width  = drawInfo.width;
                    data.charInfoResult.height = drawInfo.height;
                    
                    if (data.charInfoResult.x + data.charInfoResult.width > data.sizeLevel ||
                        data.charInfoResult.y + data.charInfoResult.height > data.sizeLevel) {
                        
                        console.log(data);
                        return;
                    }
                    
                    data.charInfoResult.page   = data.currentPageIndex;
                    
                    if (data.isKoreanFontData) {
                        
                        //옵션 추가하기
                        
                        data.charInfoResult.xoffset  = data.offset.x;
                        data.charInfoResult.yoffset  = data.offset.y;
                        data.charInfoResult.xadvance = data.xAdvance;
                    }
                    
                    data.drawInfos = null;
                    
                } else {
                    
                    //새 페이지 만들기
                    data.pageResult.push({ page: data.currentPage, texture: data.currentCanvas, name: this.FormatFileName(data.fileName, data.pageResult.length) });
                    
                    data.currentPage   = new Node(new Rect(0, 0, data.sizeLevel, data.sizeLevel));
                    data.currentCanvas = new CanvasView(data.sizeLevel, data.sizeLevel);
                    data.currentPageIndex++;
                    index--;
                    
                    if (data.events.pageCreated)
                        data.events.pageCreated(data.currentPage, data.currentCanvas);
                }
                
                index++;
            }
            
            if (data.events.progress)
                data.events.progress(index / data.chars.length, data.charCode);
            
            setTimeout(this.DrawFntGlyph.bind(this, data, index), HangulAtlasEditor.RENDER_SPEED);
            
        } else {
            
            data.pageResult.push({ page: data.currentPage, texture: data.currentCanvas, name: this.FormatFileName(data.fileName, data.pageResult.length) });
            
            var pages = [];
            
            for (var i = 0; i < data.pageResult.length; i++)
                pages.push(data.pageResult[i].name);
            
            data.result.pages = pages;
            data.result.chars = data.charResult;
            
            if (data.events.progress)
                data.events.progress(1, '-'.charCodeAt(0));
                
            if (data.events.done)
                data.events.done(data.fileName, this.ExportFntData(data.result), data.pageResult);
        }
    } catch (e) {
        
        if (data.events.error)
            data.events.error(e);
    }
};

HangulAtlasEditor.FormatFileName = function(name, index) {
    return name + "_" + index.toString().padStart(2, '0') + ".png";
}

HangulAtlasEditor.ExportFntData = function(data) {
    
    var result = "";
    
    result += "<?xml version=\"1.0\"?>\n";
    result += "<font>\n";
    
    result += "  <info";
    for (var key in data.info) result += ` ${key}="${data.info[key]}"`;
    result += "/>\n";
    
    data.common.pages = data.pages.length;
    
    result += "  <common";
    for (var key in data.common) result += ` ${key}="${data.common[key]}"`;
    result += "/>\n";
    
    result += "  <pages>\n";
    for (var key in data.pages) result += `    <page id="${key}" file="${data.pages[key]}" />\n`;
    result += "  </pages>\n";
    
    result += `  <chars count="${data.chars.length}">\n`;
    for (var key in data.chars) {
        
        result += "    <char";
        for (var key2 in data.chars[key]) result += ` ${key2}="${data.chars[key][key2]}"`;
        result += " />\n";
    }
    result += "  </chars>\n";
    
    var isKorean, charCode;
    
    result += `  <kernings count="${data.kernings.length}">\n`;
    for (var key in data.kernings) {
        
        
        
        charCode = data.kernings[key].first;
        
        isKorean = charCode >= this.UNICODE_ALPHABET_START &&
                   charCode <= this.UNICODE_ALPHABET_END &&
                   this.GetAlphabetType(charCode) !== this.AlphabetType.None;
        
        if (!isKorean)
            isKorean = charCode >= this.UNICODE_START && charCode <= this.UNICODE_END;
        
        if (isKorean)
            data.kernings[key].amount = 0;
        
        
        
        charCode = data.kernings[key].second;
        
        isKorean = charCode >= this.UNICODE_ALPHABET_START &&
                   charCode <= this.UNICODE_ALPHABET_END &&
                   this.GetAlphabetType(charCode) !== this.AlphabetType.None;
        
        if (!isKorean)
            isKorean = charCode >= this.UNICODE_START && charCode <= this.UNICODE_END;
        
        if (isKorean)
            data.kernings[key].amount = 0;
        
        
        
        result += "    <kerning";
        for (var key2 in data.kernings[key]) result += ` ${key2}="${data.kernings[key][key2]}"`;
        result += " />\n";
    }
    result += "  </kernings>\n";
    
    result += "</font>\n";
    
    return result;
};

HangulAtlasEditor.GetAlphabetType = function(code) {
    
    code = String.fromCharCode(code);
    
    if (this.UNICODE_CONSONANTS.indexOf(code) !== -1)
        return this.AlphabetType.Consonant;
    
    else if (this.UNICODE_VOWELS.indexOf(code) !== -1)
        return this.AlphabetType.Vowel;
    
    return this.AlphabetType.None;
};

HangulAtlasEditor.CopyObjectRecursive = function(source) {
    
    var type = typeof source;
    
    var result = source;
    
    if (type === 'object') {
        
        result = Array.isArray(source) ? [] : {};
        
        for (var key in source) {
            
            type = typeof source[key];
            
            if (type === 'object') {
                
                result[key] = this.CopyObjectRecursive(source[key]);
            }
            else
                result[key] = source[key];
        }
    }
    
    return result;
};

function CanvasView(width, height) {
    
    this.Element = document.createElement('canvas');
    this.Context = this.Element.getContext('2d');
    
    this.Element.width  = width  || 512;
    this.Element.height = height || 512;
};