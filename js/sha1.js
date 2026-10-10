/**
 * Synchronous SHA-1 of a UTF-8 string, as a lowercase hex digest.
 * Exposed as $.sha1 so existing callers keep working.
 */
(function ($) {
	function rotl(n, s) {
		return (n << s) | (n >>> (32 - s));
	}

	function sha1(str) {
		var bytes = unescape(encodeURIComponent(str));
		var len = bytes.length;
		var words = [];
		var i;
		for (i = 0; i < len; i++) {
			words[i >> 2] |= bytes.charCodeAt(i) << (24 - (i % 4) * 8);
		}
		words[len >> 2] |= 0x80 << (24 - (len % 4) * 8);
		words[(((len + 8) >> 6) + 1) * 16 - 1] = len * 8;

		var h0 = 0x67452301, h1 = 0xefcdab89, h2 = 0x98badcfe, h3 = 0x10325476, h4 = 0xc3d2e1f0;
		var w = [];
		for (var block = 0; block < words.length; block += 16) {
			var a = h0, b = h1, c = h2, d = h3, e = h4;
			for (i = 0; i < 80; i++) {
				w[i] = i < 16 ? (words[block + i] | 0) : rotl(w[i - 3] ^ w[i - 8] ^ w[i - 14] ^ w[i - 16], 1);
				var f, k;
				if (i < 20) { f = (b & c) | (~b & d); k = 0x5a827999; }
				else if (i < 40) { f = b ^ c ^ d; k = 0x6ed9eba1; }
				else if (i < 60) { f = (b & c) | (b & d) | (c & d); k = 0x8f1bbcdc; }
				else { f = b ^ c ^ d; k = 0xca62c1d6; }
				var t = (rotl(a, 5) + f + e + k + w[i]) | 0;
				e = d; d = c; c = rotl(b, 30); b = a; a = t;
			}
			h0 = (h0 + a) | 0; h1 = (h1 + b) | 0; h2 = (h2 + c) | 0; h3 = (h3 + d) | 0; h4 = (h4 + e) | 0;
		}

		var hex = '';
		[h0, h1, h2, h3, h4].forEach(function (h) {
			hex += ('00000000' + (h >>> 0).toString(16)).slice(-8);
		});
		return hex;
	}

	$.sha1 = sha1;
})(jQuery);
