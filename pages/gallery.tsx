import Head from "next/head";

const aiExamples = [
  {
    before: "https://storage.googleapis.com/iconic-virtual-ai.firebasestorage.app/gallery/standard_kitchen_before.jpg?GoogleAccessId=firebase-adminsdk-fbsvc%40iconic-virtual-ai.iam.gserviceaccount.com&Expires=16725225600&Signature=2swvAWf7uSLCktfCLNY7%2B%2BkKTZhjRITOu9toNVPE6IyWYl8qhCLCvtPAth0JRbvEtNSR89L7P1%2F5PGJbnHSzMB20wvZhYpkawVcL0OjI9jpR3O9%2BieBn4owx1SAveqrdVNGx1V%2FIriNXV6ov2IywyAHn7I4pykNQ4DlzIX65OeOpZV6iasoos0NjVKJSi7rQz3tw1HNHRjut50AZX9h8iF0WyiFZVBV23vRFG7oPmqtYF99odnqrVTTAuUJvfNgxgWOsgcaDocHeVxU1T%2FalQT1hF1x%2FUM7HGCxKucCOTUPu3gk9WlnY6ksu0%2FGRp5rSk4GsWIFzvfb2zLy0DqorGw%3D%3D",
    after: "https://storage.googleapis.com/iconic-virtual-ai.firebasestorage.app/gallery/standard_kitchen_after.jpg?GoogleAccessId=firebase-adminsdk-fbsvc%40iconic-virtual-ai.iam.gserviceaccount.com&Expires=16725225600&Signature=4tkUOZqKudcv2pQSdxxzYJyjryQpMOPScyRxDE87zUaRYh3EMFjUqtHb6OxfExNclZdAhmmNJnSiJ183eU2HXr%2FE6jWE32mTPxuDfFW5wML4gvftIGry%2FBVdCL2mf6Ik6lTisRCR8RDVn6ev6VcPq3Wj8ZN8QpG%2FwEBMBF%2BAwBKVeGXUGE4ruV55gYLXmLALd53nlUmCOooGyJ%2BU91B4Upb48fXMJeWaLe9HSSHaE%2FDIXeo4rKAbzqKVhTgNboaD4y7kpr0BmpIAL4i4ncr1NOse1Cb20jBRpEbh4P8RPiPsdpzFj6KlBaPST%2Fx4oOUB8culDAnNzLe4s9J274A%2BlA%3D%3D",
    style: "Modern Minimalist",
    room: "Kitchen",
    location: "Seattle, WA",
  },
  {
    before: "https://storage.googleapis.com/iconic-virtual-ai.firebasestorage.app/gallery/scandinavian_master_before.jpg?GoogleAccessId=firebase-adminsdk-fbsvc%40iconic-virtual-ai.iam.gserviceaccount.com&Expires=16725225600&Signature=BRwaWDirHIIsU6IvMtF4gtdf2Y9l0L5%2FYNTZtJ%2F%2FMS6b7uk5d%2Fiu%2BPN10b93daAh2KLR6FRK3UcsU7CUbbX0chGtEWnXXvBiPSamUIPJ3aYl%2B6fGTjRHqK9txr6LzlzT64yddz47VMJC1OpIaQQR%2BX6X20B2HsqnXD1Q%2Ff8gH%2BJbeVuJ8xoWE5uXlFEhnkoGeHGsxP6beTELTMZJehT2CM0gxT%2FXkm8JykOJK5LkE7w2c9p4jXUw8iybCxOScMZNfNX5lWgFaZbohQjxHyzpXcbQ7iT0WmEGCGw6zEB%2FUWEFx%2FeWrBBBI17mw4u7YqxmBTZr%2FAanJq1zEeBafoyPoQ%3D%3D",
    after: "https://storage.googleapis.com/iconic-virtual-ai.firebasestorage.app/gallery/scandinavian_master_after.jpg?GoogleAccessId=firebase-adminsdk-fbsvc%40iconic-virtual-ai.iam.gserviceaccount.com&Expires=16725225600&Signature=EVnM4RW9ulx%2FEKRCZaBCo0bQVRn7udPc7pu%2BXtOR%2FbzlXyFTB78md75aOR4n8NHK%2FWJM211NQFS2Nu4e5nC%2Bl0X0xuTpolT5U9%2BLtBke%2FjJVK1yaTed57RoXE3i5UzW9ZRIVW%2F1PVTOAvnjxAJtAExGWEsMbC%2Fq0rF%2FjxHHYWlrDyT36d2X3nRHJSjOFxdiWqkw9TD2JFy6bnLNiQrJE8VlBY5%2FWa90lP7n4xZMAWXiwRCdX3RDx32Yu%2FuboJeVias69SYzZtMs1Th1O9388vWW39l3rs1EVUILpJPjcwFDp4pP%2FPC2LwzR4J44KIYCxwodVYuH6xyBH7KmkegQIxw%3D%3D",
    style: "Scandinavian",
    room: "Master Bedroom",
    location: "Portland, OR",
  },
  {
    before: "https://storage.googleapis.com/iconic-virtual-ai.firebasestorage.app/gallery/coastal_living_before.jpg?GoogleAccessId=firebase-adminsdk-fbsvc%40iconic-virtual-ai.iam.gserviceaccount.com&Expires=16725225600&Signature=6Y4DVtiz8d%2BtRLw8pIgOlPpapZD%2FDB68v3g2hCFdLzEjy%2BkD2CLg0UEy5fG5xKGgs458yAgg%2BVkVE7hx2hil5XWPg31VxcU4U6qSA8V25uVuxtzWqHkR1b0nBJWIELMgvDaYDKAsHqZeVcRy7jlOc2IAQougQ%2BJJLWCM0sF1ZoVZ7uhcgeWvqTgLK%2FGnjVsT3OjV185zJuFM9JW3inlHkx%2FMUzPXA9QRB6jT51OkMxzWCnHTLWeA75C%2FtzaPccwo8ymS9ilcD3O%2FXl2yrWcI8jOZ5rDbKd8FygTiSXOZjNta2EZ%2BwqVKBQNLQlmRDL88rZAMyMS6CocNe0wIxtU9Kg%3D%3D",
    after: "https://storage.googleapis.com/iconic-virtual-ai.firebasestorage.app/gallery/coastal_living_after.jpg?GoogleAccessId=firebase-adminsdk-fbsvc%40iconic-virtual-ai.iam.gserviceaccount.com&Expires=16725225600&Signature=RHxDOdhzYHa2gnUqm4uTLuD8YGB%2FdJKrhxfZoMOPve3ObpYdefamQbYLX3i6UP7hZBhfnLtjL25SAqm8qHkQvuLI72ax0rLCroG4y19ExwLT9gQjBrTscTShv3zyL17mzbBd%2BU4Oi2uaOucYg0hwhQLz%2B5604kuf%2F5r4AJbGVuDjNX7HXL569lF6be40yyxluZPZn2lC2Nd7jNpff7Fo%2BNXI8pdmpQcArwt%2FUe%2BSGKqZa96z0yPO5aY4S2MryGFe%2BGro3aAo%2Bm4zpxvUb0ldZJf9N87BLnHR1qQXdoDWyDrvxBLxk56T13DZxjdj7MipwhsuOh1Do1MFe03ycMFnPQ%3D%3D",
    style: "Coastal Contemporary",
    room: "Living Room",
    location: "San Diego, CA",
  },
  {
    before: "https://storage.googleapis.com/iconic-virtual-ai.firebasestorage.app/gallery/industrial_master_before.jpg?GoogleAccessId=firebase-adminsdk-fbsvc%40iconic-virtual-ai.iam.gserviceaccount.com&Expires=16725225600&Signature=C1x0gtrdcLf4BkGx12yS3ik5kbTbxLr8Rg%2BsM0QK3ukFMAiollDW1MAL%2FrK6XN5PpIkd7OUVut3uqspbxg2tme5OP%2B5iWZrmwDq2YioRNzbCGGISrtn%2FedvhEsE%2FL27YpUEg8uaL6ndzaJpVZ1XdxqH31ipN1BIv9dux2ncQgUnMtifeH15%2BgCEj0r%2FOVYM1RZSY%2BFlaikfFAXZeNCsFREH6%2F76QQwkG%2FGKQr3CAt4ML7zFVnmNF0ht%2FwVpIwRjw9bceFoBOpNFrkd00RWf%2B8fjSeMvy6BE6O138gHaVXhdHBJR2%2Fvcek9bewqg0INtmDy4kHaIdJhobn7qTqkKpkg%3D%3D",
    after: "https://storage.googleapis.com/iconic-virtual-ai.firebasestorage.app/gallery/industrial_master_after.jpg?GoogleAccessId=firebase-adminsdk-fbsvc%40iconic-virtual-ai.iam.gserviceaccount.com&Expires=16725225600&Signature=IKYHFMiz3wof8XdtuEWT%2BJnNqm4rJeXr3CRQMpESbQh%2FU6dIj6Lu53TXfxbIQ6E1%2BwZcsdNtFLoG7bWLFczUCH8KE%2BSNVFMZ6qMMGj27P0qwO2mmlihcU3HWSWO9Dan3AyjxnMtHE%2B3u8k8tHX8Lx5gp7fR5yC%2Fe%2F8Sx6AMZ6gFv1kCpn3YvjSvNJda%2BR0pIaxH%2FvC12tkBQt7IHp%2BdJz6H3T%2FS1EF4yNKR2DmbW%2F6YHhQHTYonxoguhlpebb1%2BNr9y5%2F2NseDpuLcwnyKwaiFWfgKiCnuaI5KU8yO1LwrNQzWD1GXpP6xGYInak0jd1SCdS4TROifvIdXJ1Pk2wQg%3D%3D",
    style: "Industrial Modern",
    room: "Master Bedroom",
    location: "Brooklyn, NY",
  },
  {
    before: "https://storage.googleapis.com/iconic-virtual-ai.firebasestorage.app/gallery/coastal_dining_before.jpg?GoogleAccessId=firebase-adminsdk-fbsvc%40iconic-virtual-ai.iam.gserviceaccount.com&Expires=16725225600&Signature=0n%2BXtTt6olyRSLzTae0YkBDRVy5MSOjbcd%2FOiQCxVIrcapWfBRGZYF%2BBcBGiz7CqCPo973qN9y65RbbG9uFnVMg4R8JRzh4FKW5MxJdZG15hRejdXL3EdZBUGOMSs8ywSynCmy4GDVoRoNvyJN9OlKg0JpuPzZC3lZ09NpD0aEugGVbFj9s88QFvPExyWcz%2FrRWM1yM4AIvP%2FCty2ahZyT1R%2BD5e%2FDWV%2F0YGXn01TZ5WcnS6pff1Hk0f6037pe%2BFvTZGXVIdji4yD7P4fJhgvPSxAsA0jCA4To5FQjgT5Gxaez%2B20%2FZNSsrqOrvWTqg6ezEztwsuqesRurj1s7US7g%3D%3D",
    after: "https://storage.googleapis.com/iconic-virtual-ai.firebasestorage.app/gallery/coastal_dining_after.jpg?GoogleAccessId=firebase-adminsdk-fbsvc%40iconic-virtual-ai.iam.gserviceaccount.com&Expires=16725225600&Signature=w4BJEGPJJfDW28P1%2BEO4Y0Q9TRkSCjPk0Dckyft1jg1NaDppbgfHbYKhtX2AApbB5nDn8HWkxzCBcaFtOp%2F4OM2%2FHylFpWj31u6AQfwfBbBpV42EJxfff2joFy9zKTiLx5n2fU8LtNOsRC6MwTyees9ELqbySOAn92zMkObcQNXr3tAwr2SvCyKZNFOcDMMzXsjV%2FA1Z93GZ8MCP5cNzWY5xBOF1y%2B1NyI97EmNsBCCmztUd33fWs60vsRVV%2BTyXZ0vn9iT%2Fj%2F5NX%2Fh8dHzLkIgsWK4QxH%2F5%2Bmax22QoW%2F%2Bccn3ZNmbAL54tyoENNM8EdrvZ0cfvzQWIDEt%2FOCeNOQ%3D%3D",
    style: "Coastal Elegance",
    room: "Dining Room",
    location: "Charleston, SC",
  },
  {
    before: "https://storage.googleapis.com/iconic-virtual-ai.firebasestorage.app/gallery/standard_living_before.jpg?GoogleAccessId=firebase-adminsdk-fbsvc%40iconic-virtual-ai.iam.gserviceaccount.com&Expires=16725225600&Signature=BWoivajUcu6GspKlR5Ym3s620bAa1kcUaEXtctsyjQF4RK0nwXCivyDQJFOdfkx7qcFoqlIdlRV%2FP67EZzl1DnJNaInzVzYataWw7VQnV4Ihcl4OhPVQ5nhOQxeTTj%2BFr6H7qnfVakyEsZZmD3hGkk6mbdC71ICslDFrYarnqNew4nKKurCu8WwZoZDlMVmq1ga4TIwYlrOCa%2BjZFQ40d1%2Fnpk5DpEYp%2FzXtj2lKalAW4A1m7qt6x73LetT%2BjViWyiGA8B1E7wj1v5%2FISnPCxFKdDQf44j7%2FQcgrJOBe44ize6EM4uOkKEssWLhzhHom%2BoicDDrZ7TkS%2FxZxldmvjQ%3D%3D",
    after: "https://storage.googleapis.com/iconic-virtual-ai.firebasestorage.app/gallery/standard_living_after.jpg?GoogleAccessId=firebase-adminsdk-fbsvc%40iconic-virtual-ai.iam.gserviceaccount.com&Expires=16725225600&Signature=Bw%2FT3h5XQf0tzRVM887WVWspG9z7bBrp75gCIIckv51FPQCn8807K%2F0sfejVS0GoxftQNMdxkCRqpbMQ4184CG%2BYUcC%2BexVKCpx9jtS2z9JZrgON6aMwamjms64SIA%2Bw1tPLnpL5YRouQAfPVUyDYnUMB5dBfCkIlJEZBQmetJoaRYFdLGIAWz2c23ORMaWJFZl3aW%2FktzlWqYVjGUB9eLgHL9i2pz0fszF0a%2ByWt9uN68VNoW7ERpGj25vWZxacYmlMFCDleT54UWLuruHvRjpnOdT8NMdyTbpMFiutdta4JrTBrsT7L1ppxIALCWu%2B5F4FaNSxEpy8mvs8w5ustg%3D%3D",
    style: "Contemporary Classic",
    room: "Living Room",
    location: "Denver, CO",
  },
];

const proExamples = [
  {
    before: "https://storage.googleapis.com/iconic-virtual-ai.firebasestorage.app/gallery/coastal_kitchen_before.jpg?GoogleAccessId=firebase-adminsdk-fbsvc%40iconic-virtual-ai.iam.gserviceaccount.com&Expires=16725225600&Signature=m%2BSsFg%2F%2F9LPOfPztOF9XKGuVJo5ctZIuLvlEDtAe0iLLLcaxNmehGPPqqpd9X%2F02IKNHIeBcAMYkyFOpD%2BMcFVxUiXTyuPYP%2FR2rimvwb90EkryPhGl6UrkY%2BHQZaXBGaUnC9Oov8qqHZJZvWx7gCEfodEQRi5D50CADEVXln10dbNrzOlLvs5o7olym1OtvDwWETjAW8hrnMDhnw%2FPeIYLeAL%2F5M2pedTlIjQW4DNMWBKP8w56Y8ZR%2BzMCGh9%2B0qX45M3ee8VL%2BBKx4GGFYOOhwTq2PQHenPGyXsOkY3Vd%2F0T4MwNZ4XuSOfviNtSWX7Z7Ave5WRm9FlpycyF5F2Q%3D%3D",
    after: "https://storage.googleapis.com/iconic-virtual-ai.firebasestorage.app/gallery/coastal_kitchen_after.jpg?GoogleAccessId=firebase-adminsdk-fbsvc%40iconic-virtual-ai.iam.gserviceaccount.com&Expires=16725225600&Signature=3aMmWSSyhroLiakZ9anmSXFqSjdQX56Xphm5xgQXaXf8g2ZPf8f8UshoVnUQUP11mToqhcbzW0wLMLpTb8%2FPd3VvW%2B8W%2FQFjpPKQVqRQhtfz5k8HpYFm2cHcPoKHVIOqwdpf3xwJRcdL2lYvsxgZ91QzL%2Bz6VAoUysJAaEwTvpJkvax7SZorbDBVyUXbfbq45rr9bmjJuCWv2NrgEoOXETnOj1jUyKrbferTX88tyVm6JN0flRHMpa%2FgTVT41RUnYTrRTEsQET428gO5pC%2Bk2MamAprPIitkydJpUtpI%2BjQiuwR0nPxhHPDvkm%2F2UrnzB00hZ2VQRc0xJs98i%2FtxHw%3D%3D",
    style: "Coastal Kitchen",
    room: "Kitchen",
    location: "Miami, FL",
  },
  {
    before: "https://storage.googleapis.com/iconic-virtual-ai.firebasestorage.app/gallery/luxury_living_before.jpg?GoogleAccessId=firebase-adminsdk-fbsvc%40iconic-virtual-ai.iam.gserviceaccount.com&Expires=16725225600&Signature=lcg8Salg7gQMAnQw9QxD4l086ESTE0%2FnhStt562h9frxr%2BU672Kz9sqGyFs2V4ayWi4cH3Jgv6aStAbWvV83XhWSrafJFjKVwPqe7lVdRNp2%2Bl4gPNmGu3nYPO1LR0evRogrM%2BRrJkfr%2FUyu5hN7jEgu0v%2Bsn5OByj%2FACk6ROVLRo6XYlYVXQxDs4%2B7%2FNbBHeQ9ax9U3MXglrLcemq9HDLrxMF8uNoeKbQ05QjY1tJjR3s9ewHsSIGEQm6BKy0mgPh9O%2BNZFZ5TK5oeJR6Z8x274ZKmFiSfCjSdxAyuY7zHszC9vfxM7%2FoEiTyEdTZ%2FPaAybOW2s%2BNWM6wcOYABOmQ%3D%3D",
    after: "https://storage.googleapis.com/iconic-virtual-ai.firebasestorage.app/gallery/luxury_living_after.jpg?GoogleAccessId=firebase-adminsdk-fbsvc%40iconic-virtual-ai.iam.gserviceaccount.com&Expires=16725225600&Signature=xyrvsWycKvwnYJgTM2m1IyRoAdCDXpUa3MiKQzTbSvQOCX0r0jk2x5PeeZeQgdLe5cFzVF8eZBvyVjSNKKN1VzAeYSZ11o2NvGKAFphLLihwMzymdrTGgD%2BLxMowlr4LtEALxfm6T5DCIe3gvuvNWDeRSAV1O0hmdotY%2FhargQzIgHAOHMudQN8bcFnawxsa0tXiMz9VX6C7E678w4eT3Fano82Cp4KieDK5FAFvoAxZd%2Fi87BsaUWjH%2FM6SpbnzpYJcDf852lIOve%2B%2BSstQMWg1BznWkfjsEEScscd4f%2BdNrLVgsqKLJ%2BvZPhe9yu9%2FD6H28ahtVZMYAZrxqEIG0w%3D%3D",
    style: "Luxury Contemporary",
    room: "Living Room",
    location: "Los Angeles, CA",
  },
  {
    before: "https://storage.googleapis.com/iconic-virtual-ai.firebasestorage.app/gallery/farmhouse_living_before.jpg?GoogleAccessId=firebase-adminsdk-fbsvc%40iconic-virtual-ai.iam.gserviceaccount.com&Expires=16725225600&Signature=5Q%2BRYmjN5p9ePfSkgX79oBiplQMgQzTf1QOEIm7qlaplkAe67XJjVcQqSP1FwhEHuyC8QHcZpxiXbU%2BXs4TuCP%2FiupNg6VV4h0HV7X1p03l8rLAfnQsn43UWYnQ3eWA2225PHrHL9X9Yxbon75TuOf%2FO8I0KCkKATtj2mmeQ%2BYLbhACFJI00kpFDV3v33BG5pSW11qRW9q44RE6fmrDS7Zq45FWvc2AJK4F9%2F0pItDnjbfhJCG3W9AgjKRNOjWmPUMyUmwXxs6%2BNCyhKB6cTJEV1hoGEwIoyFk8Db%2FbhukpBj7gbMQMZv7xQNBrb8DT3ga8KuM8nvIZ4Ox2qUNGOHw%3D%3D",
    after: "https://storage.googleapis.com/iconic-virtual-ai.firebasestorage.app/gallery/farmhouse_living_after.png?GoogleAccessId=firebase-adminsdk-fbsvc%40iconic-virtual-ai.iam.gserviceaccount.com&Expires=16725225600&Signature=meJt3OtPD8U5%2FYq3LfWP9sOF5y9rycanhMrZCoVyV3SJuj0x5jK3dj57jBKJhblXNVFuTBsAe%2Fc3E1qIGg4c9Yla51kwaxX8Pq6NGi67joI4muwkrxq5VxANNfjQdY9oSQI3h%2FTQujsK3XpPQHnVG%2B1dIdONF07UapkVxx%2FIcUr5ZYuEwiyEQp5lrmRp9mwpLoyuAE9op1ykQdMreo25HliZTEQMa1sYXTprfrKqQJaIP8YvNV2XezRsqIyINVSk%2FThmfsDldfRMflGZH0L8Dxu41FQpPJYEkmZnMukCTOqPebRGCJT9LRFhMCrphTDPgqrfCkH3b8Vs4Gm54vIHsQ%3D%3D",
    style: "Farmhouse Modern",
    room: "Living Room",
    location: "Dallas, TX",
  },
  {
    before: "https://storage.googleapis.com/iconic-virtual-ai.firebasestorage.app/gallery/coastal_master_before.jpg?GoogleAccessId=firebase-adminsdk-fbsvc%40iconic-virtual-ai.iam.gserviceaccount.com&Expires=16725225600&Signature=Ht9GsRxN2XevUAZY5Eh7AZtTXiPHMn%2F8ShtRRPfSSFiXxG3EJnILYDsUXeQqkkV8Q5B1WHWoH43op46kOPE%2BzpMHp5BqdnW1JigUXv8gR50l2DfyVSStqndz26ayxCrPfJq5wgC6jVgMjj%2Fvba637yAXET6XdqcovRnX9u5mWM7lVxJ%2B%2FSSF4k4h4ZlE4M2GQwiHZfn3IbnLFE5MAmPW6T1O69ySSh3MkP33hQRaOQ1N1oqPeVs6aewpFxA4AdSSqVEpDGga00yp2qSfX8g1YQAa8qdTyD7hKjNQBWL1Et%2BZxKpxGgnMeTxzlUDG7VMY7SIEnPejwBr9Fef6syjttA%3D%3D",
    after: "https://storage.googleapis.com/iconic-virtual-ai.firebasestorage.app/gallery/coastal_master_after.jpg?GoogleAccessId=firebase-adminsdk-fbsvc%40iconic-virtual-ai.iam.gserviceaccount.com&Expires=16725225600&Signature=a6KTtTjVqhEJNwhr%2BR7obbGkgjo%2BtTmPIYSFYK3x%2Fb9ZcQHY3fcmCQYhY62fDlLlpOnF2bkujAKLNboD431sAGTfonQ9n0RBfy8G3Tdz8YdbmVv0TVrKVtVbmqd0bt5U3BNLmYDyYwx2qGdcWdLxVYtxmSNGjKywRDmfnCPuP9zTLa0%2BILYTSe9RhgP4zkwvNBrR4a4cWHa3nCKgAUapMhD6cCjkm8KxIvT4xFmzys1pxdHOL2%2F6p4du1hXnt9kt6LOIMau8Asx24Zg0m9CQoyD2eGV%2Fova1SE1dIPvQuLabCpE52jBr30tey7cC9XegAGLqJd8JVJGxt5wHXeM%2Biw%3D%3D",
    style: "Coastal Retreat",
    room: "Master Bedroom",
    location: "Naples, FL",
  },
];

function Card({ item, badge }: { item: typeof aiExamples[0]; badge: string }) {
  return (
    <div style={{ background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
      <div style={{ display: "flex", gap: 0 }}>
        <div style={{ flex: 1, position: "relative" }}>
          <div style={{ background: item.before, height: 220, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ background: "rgba(0,0,0,0.5)", color: "#fff", padding: "4px 12px", borderRadius: 6, fontSize: 13, fontWeight: 600 }}>BEFORE</span>
          </div>
        </div>
        <div style={{ flex: 1, position: "relative" }}>
          <div style={{ background: item.after, height: 220, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ background: "rgba(255,255,255,0.85)", color: "#0a0a0a", padding: "4px 12px", borderRadius: 6, fontSize: 13, fontWeight: 600 }}>AFTER</span>
          </div>
        </div>
      </div>
      <div style={{ padding: "16px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <span style={{ background: badge === "AI" ? "#10b981" : "#2563eb", color: "#fff", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4 }}>{badge}</span>
          <span style={{ fontWeight: 700, fontSize: 16, color: "#0a0a0a" }}>{item.style}</span>
        </div>
        <p style={{ margin: 0, fontSize: 14, color: "#666" }}>{item.room} &bull; {item.location}</p>
      </div>
    </div>
  );
}

export default function GalleryPage() {
  return (
    <>
      <Head>
        <title>Gallery | IconicVirtual.AI</title>
        <meta name="description" content="Browse before & after examples of AI virtual staging and professional designer staging by IconicVirtual.AI." />
        <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='6' fill='%230a0a0a'/%3E%3Ctext x='16' y='22' text-anchor='middle' font-size='18' font-weight='bold' fill='white' font-family='system-ui'%3EIV%3C/text%3E%3C/svg%3E" />
        <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </Head>
      <div style={{ fontFamily: "Manrope, sans-serif", color: "#0a0a0a", background: "#ffffff" }}>
        <header style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a href="/home.html" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ display: "inline-flex", width: 36, height: 36, fontSize: 14, background: "linear-gradient(135deg,#0a0a0a,#18181b)", borderRadius: 10, color: "#fff", alignItems: "center", justifyContent: "center", fontWeight: 900 }}>IV</span>
            <span style={{ fontSize: 18, fontWeight: 700, color: "#0a0a0a" }}>IconicVirtual.AI</span>
          </a>
          <a href="/home.html" style={{ color: "#10b981", textDecoration: "none", fontWeight: 500 }}>&larr; Back to Home</a>
        </header>

        <main style={{ maxWidth: 1000, margin: "0 auto", padding: "60px 24px" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <span style={{ display: "inline-block", background: "#10b981", color: "#fff", fontSize: 12, fontWeight: 700, letterSpacing: 2, padding: "6px 16px", borderRadius: 20, marginBottom: 16 }}>GALLERY</span>
            <h1 style={{ fontSize: 36, fontWeight: 900, marginBottom: 12 }}>Before &amp; After Staging Examples</h1>
            <p style={{ fontSize: 18, color: "#666", maxWidth: 600, margin: "0 auto" }}>
              See how IconicVirtual.AI transforms empty rooms into beautifully staged spaces that sell homes faster.
            </p>
          </div>

          {/* AI Staging Section */}
          <section style={{ marginBottom: 64 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
              <div style={{ width: 4, height: 28, background: "#10b981", borderRadius: 2 }}></div>
              <div>
                <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>AI Virtual Staging</h2>
                <p style={{ margin: "4px 0 0", fontSize: 14, color: "#888" }}>Instant results in under 60 seconds &bull; From $1/image</p>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(440px, 1fr))", gap: 24 }}>
              {aiExamples.map((item, i) => (
                <Card key={i} item={item} badge="AI" />
              ))}
            </div>
          </section>

          {/* Pro Staging Section */}
          <section style={{ marginBottom: 64 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
              <div style={{ width: 4, height: 28, background: "#2563eb", borderRadius: 2 }}></div>
              <div>
                <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Professional Designer Staging</h2>
                <p style={{ margin: "4px 0 0", fontSize: 14, color: "#888" }}>Expert designers &bull; 24-hour turnaround &bull; From $6/image</p>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(440px, 1fr))", gap: 24 }}>
              {proExamples.map((item, i) => (
                <Card key={i} item={item} badge="PRO" />
              ))}
            </div>
          </section>

          {/* CTA */}
          <div style={{ textAlign: "center", padding: "48px 24px", background: "#fff", borderRadius: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
            <h2 style={{ fontSize: 28, fontWeight: 900, marginBottom: 12 }}>Ready to stage your listing?</h2>
            <p style={{ fontSize: 16, color: "#666", marginBottom: 24 }}>Try AI staging free — no sign-up required. Or submit a pro order for designer-quality results.</p>
            <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
              <a href="/staging-dashboard.html" style={{ display: "inline-block", background: "#10b981", color: "#fff", padding: "14px 32px", borderRadius: 8, textDecoration: "none", fontWeight: 700, fontSize: 16 }}>Try AI Staging Free</a>
              <a href="/staging-dashboard.html#pro" style={{ display: "inline-block", background: "#2563eb", color: "#fff", padding: "14px 32px", borderRadius: 8, textDecoration: "none", fontWeight: 700, fontSize: 16 }}>Submit a Pro Order</a>
            </div>
          </div>
        </main>

        <footer style={{ textAlign: "center", padding: "40px 24px", borderTop: "1px solid #e2e8f0", color: "#999", fontSize: 14 }}>
          &copy; {new Date().getFullYear()} IconicVirtual.AI. All rights reserved.
        </footer>
      </div>
    </>
  );
    }
