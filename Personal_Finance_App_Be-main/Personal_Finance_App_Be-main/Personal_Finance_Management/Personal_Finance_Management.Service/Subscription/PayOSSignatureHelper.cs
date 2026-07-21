using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace Personal_Finance_Management.Service.Subscription;

public static class PayOSSignatureHelper
{
    public static string CreatePaymentRequestSignature(
        long orderCode,
        int amount,
        string description,
        string cancelUrl,
        string returnUrl,
        string checksumKey)
    {
        var data =
            $"amount={amount}&cancelUrl={cancelUrl}&description={description}&orderCode={orderCode}&returnUrl={returnUrl}";
        return HmacSha256Hex(data, checksumKey);
    }

    public static string CreateSignatureFromObject(JsonElement data, string checksumKey)
    {
        var dict = FlattenJsonObject(data);
        var query = string.Join(
            "&",
            dict.OrderBy(kv => kv.Key, StringComparer.Ordinal)
                .Select(kv => $"{kv.Key}={kv.Value}"));
        return HmacSha256Hex(query, checksumKey);
    }

    public static bool VerifyWebhookSignature(JsonElement data, string signature, string checksumKey)
    {
        if (string.IsNullOrWhiteSpace(signature))
        {
            return false;
        }

        var expected = CreateSignatureFromObject(data, checksumKey);
        return CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(expected.ToLowerInvariant()),
            Encoding.UTF8.GetBytes(signature.ToLowerInvariant()));
    }

    private static Dictionary<string, string> FlattenJsonObject(JsonElement element)
    {
        var result = new Dictionary<string, string>(StringComparer.Ordinal);
        if (element.ValueKind != JsonValueKind.Object)
        {
            return result;
        }

        foreach (var property in element.EnumerateObject())
        {
            result[property.Name] = NormalizeJsonValue(property.Value);
        }

        return result;
    }

    private static string NormalizeJsonValue(JsonElement value)
    {
        return value.ValueKind switch
        {
            JsonValueKind.Null => string.Empty,
            JsonValueKind.Undefined => string.Empty,
            JsonValueKind.String => value.GetString() ?? string.Empty,
            JsonValueKind.Number => value.TryGetInt64(out var l)
                ? l.ToString(CultureInfo.InvariantCulture)
                : value.GetRawText(),
            JsonValueKind.True => "true",
            JsonValueKind.False => "false",
            JsonValueKind.Array => SortAndSerializeArray(value),
            JsonValueKind.Object => SortAndSerializeObject(value),
            _ => value.GetRawText()
        };
    }

    private static string SortAndSerializeObject(JsonElement obj)
    {
        var sorted = obj.EnumerateObject()
            .OrderBy(p => p.Name, StringComparer.Ordinal)
            .ToDictionary(p => p.Name, p => JsonSerializer.Deserialize<JsonElement>(p.Value.GetRawText()));
        return JsonSerializer.Serialize(sorted);
    }

    private static string SortAndSerializeArray(JsonElement array)
    {
        var items = array.EnumerateArray()
            .Select(item => item.ValueKind == JsonValueKind.Object
                ? SortAndSerializeObject(item)
                : item.GetRawText())
            .ToList();
        return $"[{string.Join(",", items)}]";
    }

    private static string HmacSha256Hex(string data, string key)
    {
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(key));
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(data));
        return Convert.ToHexString(hash).ToLowerInvariant();
    }
}
