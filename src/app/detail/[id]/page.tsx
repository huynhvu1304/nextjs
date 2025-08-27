"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import { addToCart } from "../../../redux/slices/cartSlice";
import { useRouter } from "next/navigation";
import Footer from "@/components/Footer/Footer";
import { useSwipeable } from "react-swipeable";
import ChatbotButton from "@/components/chatbot/components/chatbutton";
import ChatbotPopup from "@/components/chatbot/ChatbotPopup";
import { API_URL, IMAGE_URL } from "@/lib/api";
import Swal from 'sweetalert2';
import { IMAGE_USER_URL } from "@/lib/api";

// Interfaces của Product, Variant, Brand, Comment, Question, Answer
interface Variant {
  _id: string;
  image: string;
  cost_price: number;
  sale_price?: number;
  size: string;
  color: string;
  stock: number;
  productId: string;
}
interface Brand {
  _id: string;
  id: string;
  name: string;
  image_logo: string;
  created_at: string;
  updated_at: string;
}
interface Product {
  flashSalePrice?: number | null;
  _id: string;
  name: string;
  images_main?: string;
  status?: string;
  price?: number;
  hot?: number;
  description: string;
  variants?: Variant[];
  categoryId?: {
    _id: string;
    name: string;
    brand?: Brand;
  };
}
interface Comment {
  _id: string;
  content: string;
  rating: number;
  created_at: string;
  user_id: { _id: string; name: string;img: string; };
  product_id: string;
  admin_reply?: string;
  isDeleted?: boolean; // Thêm trường isDeleted để đánh dấu bình luận đã xóa
}
interface Answer {
  _id: string;
  questionId: string;
  user_id: {
    role: string;
    _id: string;
    name: string;
  };
  content: string;
  createdAt: string;
  parentAnswerId?: string;
  replies?: Answer[];
}
interface Question {
  _id: string;
  product_id: string;
  user_id: { _id: string; name: string };
  content: string;
  status: "Chưa trả lời" | "Đã trả lời";
  createdAt: string;
  answers: Answer[];
  isVisible?: boolean; 
}

const Detail = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { id } = useParams();
  const productId = Array.isArray(id) ? id[0] : id;
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [commentContent, setCommentContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [visibleComments, setVisibleComments] = useState(5);
  const [relatedStart, setRelatedStart] = useState(0);
  const relatedPerPage = 4;
  const [editingReply, setEditingReply] = useState<string | null>(null);
  const [editReplyContent, setEditReplyContent] = useState("");
  const [editContent, setEditContent] = useState("");
  const [commentRating, setCommentRating] = useState(0);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [editRating, setEditRating] = useState<number>(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [newQuestionContent, setNewQuestionContent] = useState("");
  const [isSubmittingQuestion, setIsSubmittingQuestion] = useState(false);
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
  const [replyingToQuestionId, setReplyingToQuestionId] = useState<string | null>(null);
  const [answerContents, setAnswerContents] = useState<{ [id: string]: string }>({});
  const [visibleQuestions, setVisibleQuestions] = useState(2);
  const [visibleAnswers, setVisibleAnswers] = useState<{ [questionId: string]: number }>({});
  const [replyingToAnswerId, setReplyingToAnswerId] = useState<string | null>(null);
  const [replyingToQuestionQuestion, setReplyingToQuestionQuestion] = useState<{ questionId: string; userName: string; } | null>(null);
  const [canComment, setCanComment] = useState(false);
  const [commentPermissionMessage, setCommentPermissionMessage] = useState("");
  const [hasCommented, setHasCommented] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const MAX_DESC_LENGTH = 400; // Số ký tự muốn hiển thị khi thu gọn
  const [maxReplyDepth, setMaxReplyDepth] = useState(2); // Giới hạn độ sâu hiển thị
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());
  // const [flashSalePrice, setFlashSalePrice] = useState<number | null>(null);
  const [flashSalePrice, setFlashSalePrice] = React.useState<number | null>(null);
  const [flashSales, setFlashSales] = useState<any[]>([]);


  // --- KHAI BÁO selectedVariant, colors, sizes SAU CÁC HOOK useState ---
  const selectedVariant = product?.variants?.find(
    (v) => v.color === selectedColor && v.size === selectedSize
  );

  const colors = Array.from(new Set(product?.variants?.map((v) => v.color)));
  const sizes = Array.from(new Set(product?.variants?.map((v) => v.size)));
  // --- KẾT THÚC KHAI BÁO ---
  const [showChat, setShowChat] = useState(false); 

  const decreaseQty = () => setQuantity((q) => (q > 1 ? q - 1 : 1));
  const increaseQty = () => {
    if (!selectedVariant) return;
    // Nếu có flash sale, kiểm tra số lượng flash sale còn lại
    if (
      flashSalePrice !== null &&
      flashSalePrice !== undefined &&
      flashSalePrice < selectedVariant.cost_price
    ) {
      const flashSaleQty = getFlashSaleQuantity();
      if (flashSaleQty !== null && quantity >= flashSaleQty) {
        toast.warning(`Bạn chỉ có thể mua tối đa ${flashSaleQty} sản phẩm với giá flash sale!`);
        return;
      }
    }
    // Kiểm tra tồn kho tổng
    if (quantity >= selectedVariant.stock) {
      toast.warning("Số lượng vượt quá hàng tồn kho");
      return;
    }
    setQuantity((q) => q + 1);
  };

  useEffect(() => {
  const fetchFlashSales = async () => {
    try {
      const res = await fetch(`${API_URL}/flashsales`);
      if (!res.ok) throw new Error('Không lấy được flash sale');
      const data = await res.json();
      setFlashSales(data.filter((fs: any) => fs.status === 'Đang diễn ra'));
    } catch (err) {
      setFlashSales([]);
    }
  };
  fetchFlashSales();
}, []);
  // Sử dụng useEffect để tải dữ liệu sản phẩm khi productId thay đổi
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        if (!productId) return;
        const res = await fetch(`${API_URL}/products/${productId}`);
        if (!res.ok) throw new Error("Product not found");
        const data = await res.json();
        setProduct(data);
        // Tự động chọn màu sắc và kích thước mặc định khi sản phẩm thay đổi
        if (data.variants?.length) {
          setSelectedColor(data.variants[0].color);
          setSelectedSize(data.variants[0].size);
        }
      } catch (error) {
        console.error("Failed to load product", error);
      }
    };

    fetchProduct();
  }, [productId]);


  // Kiểm tra sản phẩm có trong danh sách yêu thích khi productId thay đổi
  useEffect(() => {
    const checkFavorite = async () => {
      const user = localStorage.getItem("user");
      if (!user) return; // chưa đăng nhập thì không kiểm tra

      const { id: userId } = JSON.parse(user);

      try {
        const res = await fetch(`${API_URL}/users/favorites`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`, // nếu dùng token
          },
        });

        if (!res.ok) throw new Error("Failed to fetch favorites");
        const favorites: Product[] = await res.json();

        // Kiểm tra nếu sản phẩm hiện tại có trong danh sách favorites
        if (
          productId &&
          favorites.some((fav) => String(fav._id) === String(productId))
        ) {
          setIsFavorite(true);
        } else {
          setIsFavorite(false);
        }
      } catch (error) {
        console.error("Failed to fetch favorite list", error);
      }
    };

    checkFavorite();
  }, [productId]);


  // Tải và hiển thị sản phẩm liên quan khi sản phẩm hiện tại thay đổi
  useEffect(() => {
    const fetchRelatedProducts = async () => {
      if (!product?.categoryId?._id) return;

      try {
        const res = await fetch(`${API_URL}/products`);
        if (!res.ok) throw new Error("Failed to fetch products");
        const data: Product[] = await res.json();
        const related = data.filter(
          (p) =>
            p._id !== product._id &&
            p.categoryId?._id === product.categoryId?._id &&
            p.status === "active"
        );
        const shuffled = related.sort(() => 0.5 - Math.random());

        // Fetch flash sales
        const flashRes = await fetch(`${API_URL}/flashsales`);
        const flashSales = flashRes.ok ? await flashRes.json() : [];
        const activeFlashes = flashSales.filter((fs: any) => fs.status === 'Đang diễn ra');

        // Gán flashSalePrice cho từng sản phẩm liên quan
        const relatedWithSale = shuffled.map((rp) => {
          const variant = rp.variants && rp.variants.length > 0 ? rp.variants[0] : null;
          let flashSalePrice = null;
          if (variant) {
            for (const fs of activeFlashes) {
              const found = fs.products.find(
                (p: any) =>
                  String(p.product_id?._id) === String(rp._id) &&
                  String(p.variant_id) === String(variant._id) &&
                  p.quantity > 0 // CHỈ ÁP DỤNG FLASHSALE NẾU CÒN HÀNG
              );
              if (found && typeof fs.discount_value === 'number') {
                const salePrice = variant.cost_price - fs.discount_value;
                if (flashSalePrice === null || salePrice < flashSalePrice) {
                  flashSalePrice = salePrice;
                }
              }
            }
          }
          return { ...rp, flashSalePrice };
        });
        setRelatedProducts(relatedWithSale);
      } catch (error) {
        setRelatedProducts([]);
      }
    };
    fetchRelatedProducts();
  }, [product]);



  useEffect(() => {
  const checkFlashSale = async () => {
    if (!selectedVariant || !product) {
      setFlashSalePrice(null);
      return;
    }
    try {
      const res = await fetch(`${API_URL}/flashsales`);
      if (!res.ok) throw new Error('Không lấy được flash sale');
      const flashSales = await res.json();
      // Lọc tất cả flash sale đang diễn ra
      const activeFlashes = flashSales.filter((fs: any) => fs.status === 'Đang diễn ra');
      let maxDiscount = null;
      let bestSalePrice = null;
      for (const fs of activeFlashes) {
  const found = fs.products.find(
    (p: any) =>
      String(p.product_id?._id) === String(product._id) &&
      String(p.variant_id) === String(selectedVariant._id) &&
      p.quantity > 0
  );
  if (found && typeof fs.discount_value === 'number') {
    // SỬA ĐIỀU KIỆN Ở ĐÂY
    const basePrice = (selectedVariant.sale_price !== undefined && selectedVariant.sale_price !== null && selectedVariant.sale_price > 0)
      ? selectedVariant.sale_price
      : selectedVariant.cost_price;
    const salePrice = Math.round(basePrice * (1 - fs.discount_value / 100));
    if (maxDiscount === null || fs.discount_value > maxDiscount) {
      maxDiscount = fs.discount_value;
      bestSalePrice = salePrice;
    }
  }
}
      if (bestSalePrice !== null) {
        setFlashSalePrice(bestSalePrice);
      } else {
        setFlashSalePrice(null);
      }
    } catch (err) {
      setFlashSalePrice(null);
    }
  };
  checkFlashSale();
}, [selectedVariant, product]);


  // Tải danh sách câu hỏi liên quan đến sản phẩm khi productId thay đổi
  useEffect(() => {
    const fetchQuestions = async () => {
      if (!productId) return;
      try {
        const res = await fetch(
          `${API_URL}/questions/product/${productId}`
        );
        if (!res.ok) throw new Error("Lỗi tải câu hỏi");
        const data: Question[] = await res.json();
        setQuestions(data);
      } catch (error) {
        console.error("Lỗi khi tải câu hỏi:", error);
        setQuestions([]);
      }
    };
    fetchQuestions();
  }, [productId]);

  const onReply = React.useCallback((q: any) => {
    setReplyingToQuestionId(q._id);
  }, []);

  const handlers = useSwipeable({
    onSwipedLeft: () => handleNextRelated(),
    onSwipedRight: () => handlePrevRelated(),
    trackMouse: true,
  });
  // Cập nhật toggleFavorite để đồng bộ trạng thái với backend
  const toggleFavorite = async (_id: string) => {
    const user = localStorage.getItem("user");
    if (!user) {
      toast.warning("Bạn cần đăng nhập để sử dụng chức năng này");
      return;
    }
    const { id: userId } = JSON.parse(user);

    try {
      if (!isFavorite) {
        // Thêm vào yêu thích
        const res = await fetch(
          `${API_URL}/users/${userId}/favorites/${product?._id}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        if (!res.ok) throw new Error("Không thể thêm vào yêu thích");
        setIsFavorite(true);
        toast.success("Đã thêm vào danh sách yêu thích");
      } else {
        // Xóa khỏi yêu thích
        const res = await fetch(
          `${API_URL}/users/favorites/${product?._id}`,
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        if (!res.ok) throw new Error("Không thể xóa khỏi yêu thích");
        setIsFavorite(false);
        toast.success("Đã xóa khỏi danh sách yêu thích");
      }
    } catch (error) {
      console.error(error);
      toast.error("Có lỗi xảy ra, vui lòng thử lại");
    }
    window.dispatchEvent(new Event("favoriteChanged"));
  };


  // Lấy danh sách bình luận khi load sản phẩm
  useEffect(() => {
    const fetchComments = async () => {
      if (!productId) return;
      try {
        const res = await fetch(`${API_URL}/comments/${productId}`);
        if (!res.ok) throw new Error("Lỗi tải bình luận");
        const data = await res.json();
        setComments(data);
      } catch (error) {
        setComments([]);
      }
    };
    fetchComments();
  }, [productId]);

  // Kiểm tra quyền bình luận của người dùng khi productId thay đổi
  useEffect(() => {
    const checkCommentPermission = async () => {
      const user = localStorage.getItem("user");
      if (!user || !productId) {
        setCanComment(false);
        setCommentPermissionMessage("Bạn cần đăng nhập để bình luận");
        return;
      }
      const { id: userId } = JSON.parse(user);
      try {
        const res = await fetch(
          `${API_URL}/comments/check-permission?userId=${userId}&productId=${productId}`
        );
        const data = await res.json();
        setCanComment(data.canComment);
        setHasCommented(data.hasCommented);
        setCommentPermissionMessage(data.message);
      } catch (error) {
        console.error("Lỗi kiểm tra quyền bình luận:", error);
        setCanComment(false);
        setCommentPermissionMessage("Có lỗi xảy ra khi kiểm tra quyền bình luận");
      }
    };
    checkCommentPermission();
  }, [productId]);

  // Gửi bình luận mới
  const handleSubmitComment = async () => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) {
        toast.warning("Bạn cần đăng nhập để bình luận");
        return;
      }
      const currentUser = JSON.parse(userStr);
      // Kiểm tra ID người dùng
      if (!currentUser?.id) {
        toast.error("Không tìm thấy thông tin người dùng");
        return;
      }
      if (!commentContent.trim()) {
        toast.warning("Vui lòng nhập nội dung bình luận");
        return;
      }
      setIsSubmitting(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: commentContent,
          rating: commentRating,
          user_id: currentUser.id,
          product_id: productId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Lỗi gửi bình luận");
      }
      // Đảm bảo comment mới có đủ thông tin user
      const commentWithUser = {
        ...data,
        user_id: {
          _id: currentUser.id,
          name: currentUser.name,
          img: currentUser.img,
        },
      };
      setComments((prev) => [commentWithUser, ...prev]);
      setCommentContent("");
      setCommentRating(5);
      setHasCommented(true);
      toast.success("Đã gửi bình luận!");
    } catch (error: any) {
      console.error("Lỗi bình luận:", error);
      toast.error(error.message || "Gửi bình luận thất bại");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Hàm chỉnh sửa bình luận
  const handleEditComment = async (commentId: string) => {
    if (!editContent.trim()) {
      toast.warning("Vui lòng nhập nội dung bình luận");
      return;
    }
    if (editRating < 1 || editRating > 5) {
      toast.warning("Vui lòng chọn số sao đánh giá");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const userStr = localStorage.getItem("user");
      if (!token || !userStr) {
        toast.error("Vui lòng đăng nhập lại");
        return;
      }
      const currentUser = JSON.parse(userStr);
      const res = await fetch(`${API_URL}/comments/${commentId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: editContent,
          rating: editRating,
          user_id: currentUser.id,
        }),
      });
      if (!res.ok) {
        throw new Error("Cập nhật thất bại");
      }
      const updatedComment = await res.json();
      // Tìm comment cũ để lấy thông tin user
      const existingComment = comments.find(c => c._id === commentId);
      // Cập nhật state với comment đã được cập nhật, giữ nguyên thông tin user
      setComments((prev) =>
        prev.map((c) =>
          c._id === commentId
            ? {
              ...updatedComment,
              user_id: existingComment?.user_id || {
                _id: currentUser.id,
                name: currentUser.name,
              },
            }
            : c
        )
      );
      setEditingComment(null);
      setEditContent("");
      setEditRating(0);
      // window.location.reload();
       toast.success("Đã cập nhật đánh giá!");
    } catch (error: any) {
      console.error("Lỗi cập nhật:", error);
      toast.error(error.message || "Cập nhật bình luận thất bại");
    }
  };

  // Hàm xóa bình luận
  // const handleDeleteComment = async (commentId: string) => {
  //   setIsDeleting(true);
  //   try {
  //     const userStr = localStorage.getItem("user");
  //     const currentUser = userStr ? JSON.parse(userStr) : null;
  //     const isAdmin = currentUser?.role === "admin";
  //     const res = await fetch(`${API_URL}/comments/${commentId}`, {
  //       method: "DELETE",
  //       headers: {
  //         "Content-Type": "application/json",
  //         Authorization: `Bearer ${localStorage.getItem("token")}`,
  //       },
  //       body: JSON.stringify({
  //         user_id: currentUser?.id,
  //         isAdmin,
  //       }),
  //     });
  //     if (!res.ok) throw new Error("Lỗi xóa bình luận");

  //     setComments((prev) => prev.filter((c) => c._id !== commentId));
  //     window.location.reload();
  //   } catch (error) {
  //     toast.error("Xóa bình luận thất bại");
  //   } finally {
  //     setIsDeleting(false);
  //   }
  // };

  //Reply bình luận(admin)
  const handleAdminReply = async (commentId: string) => {
    if (!replyContent.trim()) {
      toast.warning("Vui lòng nhập nội dung phản hồi");
      return;
    }
    try {
      const res = await fetch(
        `${API_URL}/comments/${commentId}/reply`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ admin_reply: replyContent }),
        }
      );
      if (!res.ok) throw new Error("Lỗi gửi phản hồi");

      const updatedComment = await res.json();
      setComments((prev) =>
        prev.map((c) => (c._id === commentId ? updatedComment : c))
      );
      setReplyingId(null);
      setReplyContent("");
      toast.success("Đã phản hồi bình luận!");
    } catch (error) {
      toast.error("Gửi phản hồi thất bại");
    }
  };

  // Chỉnh sửa phản hồi bình luận(admin)
  const handleEditReply = async (commentId: string) => {
    if (!editReplyContent.trim()) {
      toast.warning("Vui lòng nhập nội dung phản hồi");
      return;
    }
    try {
      const res = await fetch(
        `${API_URL}/comments/${commentId}/reply`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ admin_reply: editReplyContent }),
        }
      );
      if (!res.ok) throw new Error("Lỗi cập nhật phản hồi");
      const updatedComment = await res.json();
      setComments((prev) =>
        prev.map((c) => (c._id === commentId ? updatedComment : c))
      );
      setEditingReply(null);
      setEditReplyContent("");
      toast.success("Đã cập nhật phản hồi!");
    } catch (error) {
      toast.error("Cập nhật phản hồi thất bại");
    }
  };

  // Xóa phản hồi bình luận(admin)
  const handleDeleteReply = async (commentId: string) => {
    const result = await Swal.fire({
      title: 'Bạn có chắc muốn xóa phản hồi này?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
    });
    if (!result.isConfirmed) return;
    try {
      const res = await fetch(
        `${API_URL}/comments/${commentId}/reply`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (!res.ok) throw new Error("Lỗi xóa phản hồi");
      const updatedComment = await res.json();
      setComments((prev) =>
        prev.map((c) => (c._id === commentId ? updatedComment : c))
      );
      toast.success("Đã xóa phản hồi!");
    } catch (error) {
      toast.error("Xóa phản hồi thất bại");
    }
  };
  // Hàm sử lý nút mũi tên (sp liên quan)
  const handlePrevRelated = () => {
    setRelatedStart((prev) => Math.max(prev - 1, 0)); // Chỉ lùi 1 sản phẩm
  };
  const handleNextRelated = () => {
    setRelatedStart((prev) =>
      Math.min(prev + 1, Math.max(relatedProducts.length - relatedPerPage, 0)) // Chỉ tiến 1 sản phẩm
    );
  };

  // Thêm function kiểm tra stock của variant được chọn
  const isVariantOutOfStock = (color: string, size: string) => {
    return !product?.variants?.find(
      (v) => v.color === color && v.size === size && v.stock > 0
    );
  };
  // Kiểm tra xem màu sắc hoặc kích thước đã hết hàng hay chưa
  const isColorOutOfStock = (color: string) => {
    return !product?.variants?.some((v) => v.color === color && v.stock > 0);
  };
  // Kiểm tra xem kích thước đã hết hàng hay chưa
  const isSizeOutOfStock = (size: string) => {
    return !product?.variants?.some(
      (v) => v.size === size && v.color === selectedColor && v.stock > 0
    );
  };
  // Thêm function kiểm tra variant có đang trong đợt flash sale hay không
  const isVariantInFlashSale = (color: string, size: string) => {
    if (!product?.variants) return false;
    const variant = product.variants.find(v => v.color === color && v.size === size);
    if (!variant) return false;
    // Lấy flash sale đang diễn ra từ state flashSales (đã fetch ở useEffect)
    const activeFlashes = flashSales.filter((fs: any) => fs.status === 'Đang diễn ra');
    return activeFlashes.some((fs: any) =>
      fs.products.some((p: any) =>
        String(p.product_id?._id) === String(product._id) &&
        String(p.variant_id) === String(variant._id) &&
        p.quantity > 0
      )
    );
  };
  if (!product) return <div>Đang tải...</div>;
  // Helper: Lấy số lượng flash sale còn lại cho variant đang chọn
const getFlashSaleQuantity = () => {
  if (!selectedVariant || !product) return null;
  const activeFlashes = flashSales.filter((fs: any) => fs.status === 'Đang diễn ra');
  for (const fs of activeFlashes) {
    const found = fs.products.find(
      (p: any) =>
        String(p.product_id?._id) === String(product._id) &&
        String(p.variant_id) === String(selectedVariant._id) &&
        p.quantity > 0
    );
    if (found) return found.quantity;
  }
  return null;
};

  
  const handleAddToCart = () => {
    // Kiểm tra đăng nhập
    const user = localStorage.getItem("user");
    if (!user) {
      toast.warning("Vui lòng đăng nhập để thêm vào giỏ hàng");
      return;
    }
    // Kiểm tra đã chọn variant chưa
    if (!selectedVariant || !product) {
      toast.warning("Vui lòng chọn phiên bản sản phẩm");
      return;
    }
    // Kiểm tra số lượng tồn kho
    if (selectedVariant.stock < quantity) {
      toast.warning("Số lượng vượt quá hàng tồn kho");
      return;
    }
  
    // Nếu có flash sale, kiểm tra số lượng flash sale còn lại
    if (
      flashSalePrice !== null &&
      flashSalePrice !== undefined &&
      flashSalePrice < selectedVariant.cost_price
    ) {
      const flashSaleQty = getFlashSaleQuantity();
      if (flashSaleQty !== null && quantity > flashSaleQty) {
        toast.warning(`Bạn chỉ có thể mua tối đa ${flashSaleQty} sản phẩm với giá flash sale!`);
        return;
      }
    }
  
    // Xác định giá bán: nếu có flashSalePrice và nhỏ hơn giá gốc thì lấy flashSalePrice, ngược lại lấy sale_price hoặc cost_price
    let finalPrice = selectedVariant.cost_price;
    if (
      flashSalePrice !== null &&
      flashSalePrice !== undefined &&
      flashSalePrice < selectedVariant.cost_price
    ) {
      finalPrice = flashSalePrice;
    } else if (selectedVariant.sale_price !== undefined && selectedVariant.sale_price !== null) {
      finalPrice = selectedVariant.sale_price;
    }
  
    const cartItem = {
      _id: Math.random().toString(),
      productId: product._id,
      variantId: selectedVariant._id,
      quantity: quantity,
      note: "",
      productName: product.name,
      productImage: product.images_main || "",
      variantDetails: {
        _id: selectedVariant._id,
        size: selectedVariant.size,
        color: selectedVariant.color,
        cost_price: selectedVariant.cost_price,
        cost_sale: finalPrice,
        image: selectedVariant.image,
      },
    };
    dispatch(addToCart(cartItem));
    toast.success("Đã thêm vào giỏ hàng");
  };
  

  // Gửi câu hỏi mới (không có parent_id)
  const handleSubmitQuestion = async () => {
    if (!newQuestionContent.trim()) {
      toast.warning("Vui lòng nhập nội dung câu hỏi");
      return;
    }
    setIsSubmittingQuestion(true);
    const user = localStorage.getItem("user");
    if (!user) {
      toast.warning("Bạn cần đăng nhập để đặt câu hỏi");
      setIsSubmittingQuestion(false);
      return;
    }
    const { id: user_id } = JSON.parse(user);
    try {
      const res = await fetch(`${API_URL}/questions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          content: newQuestionContent,
          product_id: productId,
          parent_id: null,
          user_id: user_id,
        }),
      });
      if (!res.ok) throw new Error("Gửi câu hỏi thất bại");
      const newQuestion = await res.json();
      setQuestions((prev) => [newQuestion, ...prev]);
      setNewQuestionContent("");
      toast.success("Đã gửi câu hỏi!");
    } catch (error) {
      toast.error("Gửi câu hỏi thất bại");
    } finally {
      setIsSubmittingQuestion(false);
    }
  };

  // Gửi trả lời (reply)
  const handleSubmitAnswer = async (questionId: string, parent_id: string | null, content: string, onDone?: () => void) => {
    if (!content.trim()) {
      toast.warning("Vui lòng nhập nội dung trả lời");
      return;
    }
    setIsSubmittingAnswer(true);
    const user = localStorage.getItem("user");
    if (!user) {
      toast.warning("Bạn cần đăng nhập để trả lời");
      setIsSubmittingAnswer(false);
      return;
    }
    const { id: user_id } = JSON.parse(user);
    try {
      const res = await fetch(`${API_URL}/questions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          content,
          product_id: productId,
          parent_id,
          user_id,
        }),
      });
      if (!res.ok) throw new Error("Gửi trả lời thất bại");
      // Sau khi gửi thành công mới reload lại danh sách
      const resReload = await fetch(`${API_URL}/questions/product/${productId}`);
      const data: Question[] = await resReload.json();
      setQuestions(data);
      if (onDone) onDone();
      toast.success("Đã gửi trả lời!");
    } catch (error) {
      toast.error("Gửi trả lời thất bại");
    } finally {
      setIsSubmittingAnswer(false);
    }
  };


  const handleDeleteQuestion = async (id: string) => {
  const result = await Swal.fire({
    title: 'Bạn có chắc muốn xóa?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Xóa',
    cancelButtonText: 'Hủy',
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
  });
  if (!result.isConfirmed) return;
  try {
    const userStr = localStorage.getItem("user");
    const currentUser = userStr ? JSON.parse(userStr) : null;
    const isAdmin = currentUser?.role === "admin";
    const res = await fetch(`${API_URL}/questions/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({
        user_id: currentUser?.id,
        isAdmin,
      }),
    });
    if (!res.ok) throw new Error("Xóa thất bại");
    // Reload lại danh sách câu hỏi
    const resReload = await fetch(`${API_URL}/questions/product/${productId}`);
    const data: Question[] = await resReload.json();
    setQuestions(data);
    toast.success("Đã xóa!");
  } catch (error) {
    toast.error("Xóa thất bại");
  }
};

  const QuestionThread = React.memo(({
    question,
    currentUser,
    isAdmin,
    onReply,
    onDelete,
    replyingToQuestionId,
    setReplyingToQuestionId,
    handleSubmitAnswer,
    visibleAnswers,
    setVisibleAnswers,
  }: {
    question: any;
    currentUser: any;
    isAdmin: boolean;
    onReply: (q: any) => void;
    onDelete: (id: string) => void;
    replyingToQuestionId: string | null;
    setReplyingToQuestionId: React.Dispatch<React.SetStateAction<string | null>>;
    handleSubmitAnswer: (
      questionId: string,
      parent_id: string | null,
      content: string,
      onDone?: () => void
    ) => void;
    visibleAnswers: { [questionId: string]: number };
    setVisibleAnswers: React.Dispatch<React.SetStateAction<{ [questionId: string]: number }>>;
  }) => {
    // Đặt localAnswer thành state riêng cho mỗi instance
    const [localAnswer, setLocalAnswer] = React.useState("");

    React.useEffect(() => {
      if (replyingToQuestionId !== question._id) setLocalAnswer("");
    }, [replyingToQuestionId, question._id]);

    // Số lượng trả lời hiển thị cho câu hỏi này
    const numVisible = visibleAnswers[question._id] || 2;
    const replies = question.replies || [];
    const repliesToShow = replies.slice(0, numVisible);

  return (
    <div className="ml-4 mt-2 border-l pl-2">
      <div className="flex items-center gap-2">
        {/* Avatar tròn */}
     <img
  src={
    question.user_id?.img
      ? `${IMAGE_USER_URL}/${question.user_id.img}`
      : "/img/default.png"
  }
  alt={question.user_id?.name || "Người dùng"}
  className="w-8 h-8 rounded-full object-cover"
  onError={(e) => { e.currentTarget.src = "/img/default.png"; }}
/>
        <span
  className={`font-semibold ${question.user_id?.role === "admin" ? "text-red-600" : ""}`}
>
  {question.user_id?.name}
</span>
        <span className="text-gray-500 text-xs">
          {new Date(question.createdAt).toLocaleString()}
        </span>
        {(isAdmin || currentUser?.id === question.user_id?._id) && (
          <button
            className="text-red-500 text-xs ml-2"
            onClick={() => onDelete(question._id)}
          >
            Xóa
          </button>
        )}
        <button
          className="text-blue-600 hover:underline text-xs ml-2"
          onClick={() => onReply(question)}
        >
          Trả lời
        </button>
      </div>
      <div className="mt-1">{question.content}</div>
      {replyingToQuestionId === question._id && (
        <div className="mt-2 ml-4">
          <textarea
            className="w-full border rounded p-2"
            rows={2}
            placeholder="Nhập trả lời..."
            value={localAnswer}
            onChange={(e) => setLocalAnswer(e.target.value)}
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={() =>
                handleSubmitAnswer(
                  question._id,
                  question._id,
                  localAnswer,
                  () => {
                    setReplyingToQuestionId(null);
                    setLocalAnswer("");
                  }
                )
              }
              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Gửi
            </button>
            <button
              onClick={() => {
                setReplyingToQuestionId(null);
                setLocalAnswer("");
              }}
              className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Hủy
            </button>
          </div>
        </div>
      )}
      {/* Hiển thị replies */}
      {repliesToShow.map((reply: any) => (
        <QuestionThread
          key={reply._id}
          question={reply}
          currentUser={currentUser}
          isAdmin={isAdmin}
          onReply={onReply}
          onDelete={onDelete}
          replyingToQuestionId={replyingToQuestionId}
          setReplyingToQuestionId={setReplyingToQuestionId}
          handleSubmitAnswer={handleSubmitAnswer}
          visibleAnswers={visibleAnswers}
          setVisibleAnswers={setVisibleAnswers}
        />
      ))}
      {/* Nút xem thêm trả lời */}
      {replies.length > numVisible && (
        <button
          onClick={() =>
            setVisibleAnswers((prev) => ({
              ...prev,
              [question._id]: numVisible + 5,
            }))
          }
          className="text-blue-600 hover:underline text-xs mt-2"
        >
          Xem thêm trả lời
        </button>
      )}
    </div>
  ); 
}); 

  // Hàm xử lý khi người dùng nhấn nút "Đặt câu hỏi"


  // Hàm xử lý khi người dùng nhấn nút "Trả lời câu hỏi"
 

  // Thêm helper function để sắp xếp câu trả lời theo cấu trúc cây
 


  // Component hiển thị câu trả lời theo cấp


  

  return (
    <>
    <div className="container-custom bg-white rounded-lg py-5 font-sans mt-[70px]">
      {/* product-top */}
      <div className="flex flex-wrap gap-10">
        <div className="flex-1 min-w-[300px] max-w-[650px]">
          <img
            src={`${IMAGE_URL}/${selectedVariant?.image || product.images_main
              }`}
            alt={product.name}
            className="w-full h-[475px] rounded-lg object-contain"
          />
        </div>
        <div className="flex-1 min-w-[300px] flex flex-col gap-4">
          <h1 className="text-2xl font-semibold text-gray-900">
            {product.name}
          </h1>
         {/* Giá tiền */}
<div className="text-2xl font-bold text-red-600 mb-5 flex items-center gap-4">
  {selectedVariant ? (() => {
    // flashSalePrice là GIÁ ĐÃ GIẢM, không phải phần trăm
    const hasSalePrice = selectedVariant.sale_price !== undefined && selectedVariant.sale_price !== null && selectedVariant.sale_price > 0;
    let bestPrice = selectedVariant.cost_price;
    if (flashSalePrice !== null && hasSalePrice) {
      bestPrice = Math.min(flashSalePrice, selectedVariant.sale_price!);
    } else if (flashSalePrice !== null) {
      bestPrice = flashSalePrice;
    } else if (hasSalePrice) {
      bestPrice = selectedVariant.sale_price!;
    }

    if (bestPrice < selectedVariant.cost_price) {
      return (
        <>
          <span>{bestPrice.toLocaleString()}đ</span>
          <span className="text-gray-500 line-through text-lg">
            {selectedVariant.cost_price.toLocaleString()}đ
          </span>
          {/* <span className="ml-2 text-xs font-bold text-orange-600 bg-orange-100 rounded px-2 py-0.5">
            -{Math.round(100 - (bestPrice / selectedVariant.cost_price) * 100)}%
          </span> */}
        </>
      );
    }
    return <span>{selectedVariant.cost_price.toLocaleString()}đ</span>;
  })() : (
    <span>Liên hệ</span>
  )}
</div>
                    {/* Hiển thị trung bình đánh giá */}
          <div className="flex items-center gap-2 mb-5">
            <span className="text-yellow-500 text-lg font-semibold">
              {
                (() => {
                  const visibleComments = comments.filter(c => c.isDeleted === false);
                  return visibleComments.length > 0
                    ? (visibleComments.reduce((acc, c) => acc + c.rating, 0) / visibleComments.length).toFixed(1)
                    : "0.0";
                })()
              }
            </span>
            {/* Hiển thị từng sao vàng/xám */}
            <span className="flex">
              {Array.from({ length: 5 }).map((_, i) => {
                const visibleComments = comments.filter(c => c.isDeleted === false);
                const avg =
                  visibleComments.length > 0
                    ? visibleComments.reduce((acc, c) => acc + c.rating, 0) / visibleComments.length
                    : 0;
                return (
                  <i
                    key={i}
                    className={`fas fa-star ${i < Math.round(avg) ? "text-yellow-400" : "text-gray-300"}`}
                  ></i>
                );
              })}
            </span>
            <span className="text-gray-500 text-sm">
              ({comments.filter(c => c.isDeleted === false).length} đánh giá)
            </span>
          </div>

          {/* Màu sắc */}
          <div className="mb-5">
            <label className="block mb-2 font-bold text-gray-700">
              Màu sắc:
            </label>
            <div className="flex gap-3 flex-wrap">
              {colors.map((color) => {
  // Kiểm tra có variant nào với màu này và selectedSize đang flash sale
  const hasFlashSale = product?.variants?.some(
    (v) =>
      v.color === color &&
      (selectedSize ? v.size === selectedSize : true) &&
      isVariantInFlashSale(v.color, v.size)
  );
  return (
    <React.Fragment key={color}>
      <input
        type="radio"
        name="color"
        id={`color-${color}`}
        checked={selectedColor === color}
        onChange={() => setSelectedColor(color)}
        className="hidden"
        disabled={isColorOutOfStock(color)}
      />
      <label
        htmlFor={`color-${color}`}
        className={`cursor-pointer select-none rounded-md px-5 py-2 border-2 font-medium flex items-center relative
          ${selectedColor === color
            ? "bg-green-600 border-green-600 text-white"
            : isColorOutOfStock(color)
              ? "border-gray-300 text-gray-400 bg-gray-100 cursor-not-allowed"
              : "border-gray-300 text-gray-700 hover:border-green-600"
          }
        `}
      >
        {color}
        {hasFlashSale && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs px-2 py-0.5 rounded-bl-lg rounded-tr-md z-10 flex items-center gap-1">
            <i className="fas fa-bolt"></i>
          </span>
        )}
        {isColorOutOfStock(color) && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-1 rounded">
            Hết hàng
          </span>
        )}
      </label>
    </React.Fragment>
  );
})}
            </div>
          </div>

          {/* Kích thước */}
          <div className="mb-5">
            <label className="block mb-2 font-bold text-gray-700">
              {product.categoryId?.name === "Vợt cầu lông"
               ? "Trọng lượng:"
                : "Kích thước:"}
            </label>
            <div className="flex gap-3 flex-wrap">
              {sizes.map((size) => {
  // Kiểm tra có variant nào với selectedColor và size này đang flash sale
  const hasFlashSale = product?.variants?.some(
    (v) =>
      v.size === size &&
      (selectedColor ? v.color === selectedColor : true) &&
      isVariantInFlashSale(v.color, v.size)
  );
  return (
    <React.Fragment key={size}>
      <input
        type="radio"
        name="size"
        id={`size-${size}`}
        checked={selectedSize === size}
        onChange={() => setSelectedSize(size)}
        className="hidden"
        disabled={isSizeOutOfStock(size)}
      />
      <label
        htmlFor={`size-${size}`}
        className={`cursor-pointer select-none rounded-md px-5 py-2 border-2 font-medium flex items-center relative
          ${selectedSize === size
            ? "bg-green-600 border-green-600 text-white"
            : isSizeOutOfStock(size)
              ? "border-gray-300 text-gray-400 bg-gray-100 cursor-not-allowed"
              : "border-gray-300 text-gray-700 hover:border-green-600"
          }
        `}
      >
        {size.toUpperCase()}
        {hasFlashSale && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs px-2 py-0.5 rounded-bl-lg rounded-tr-md z-10 flex items-center gap-1">
            <i className="fas fa-bolt"></i>
          </span>
        )}
        {isSizeOutOfStock(size) && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-1 rounded">
            Hết hàng
          </span>
        )}
      </label>
    </React.Fragment>
  );
})}
            </div>
          </div>

          {/* Số lượng */}
          <div className="inline-flex items-center gap-1 mb-5">
            <button
              onClick={decreaseQty}
              className={`w-10 h-10 p-0 m-0 border border-gray-300 text-2xl flex justify-center items-center rounded-md select-none
      ${isVariantOutOfStock(selectedColor!, selectedSize!)
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-gray-200 hover:bg-gray-300"
                }`}
              disabled={isVariantOutOfStock(selectedColor!, selectedSize!)}
            >
              -
            </button>
            <input
              type="text"
              id="quantity"
              value={
                isVariantOutOfStock(selectedColor!, selectedSize!)
                  ? 0
                  : quantity
              }
              readOnly
              className="w-12 h-10 text-center text-lg border-t border-b border-gray-300 bg-white pointer-events-none select-none"
            />
            <button
              onClick={increaseQty}
              className={`w-10 h-10 p-0 m-0 border border-gray-300 text-2xl flex justify-center items-center rounded-md select-none
      ${isVariantOutOfStock(selectedColor!, selectedSize!)
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-gray-200 hover:bg-gray-300"
                }`}
              disabled={isVariantOutOfStock(selectedColor!, selectedSize!)}
            >
              +
            </button>
          </div>

          {/* Buttons */}
          <div className="flex gap-4 mb-8">
            <button
              className={`${isVariantOutOfStock(selectedColor!, selectedSize!)
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-yellow-500 hover:bg-yellow-600"
                } text-white py-3 px-6 rounded-md font-semibold flex items-center gap-2`}
              disabled={isVariantOutOfStock(selectedColor!, selectedSize!)}
              onClick={handleAddToCart}
            >
              <i className="fas fa-cart-plus"></i>
              <span className="hidden sm:inline">
                {isVariantOutOfStock(selectedColor!, selectedSize!)
                  ? "Hết hàng"
                  : "Thêm vào giỏ hàng"}
              </span>
            </button>
            {/* <button
              className={`${isVariantOutOfStock(selectedColor!, selectedSize!)
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-800"
                } text-white py-3 px-6 rounded-md font-semibold flex items-center gap-2`}
              disabled={isVariantOutOfStock(selectedColor!, selectedSize!)}
              title={
                isVariantOutOfStock(selectedColor!, selectedSize!)
                  ? "Sản phẩm đã hết hàng"
                  : ""
              }
            >
              
              
              <i className="fas fa-shopping-bag"></i>

               <span className="hidden sm:inline">
                {isVariantOutOfStock(selectedColor!, selectedSize!)
                  ? "Hết hàng"
                  : "Mua ngay"}
              </span>

              {isVariantOutOfStock(selectedColor!, selectedSize!)
                ? "Hết hàng"
                : "Mua ngay"}

            </button> */}
            <button
              className="bg-red-500 hover:bg-red-700 text-white py-3 px-6 rounded-md font-semibold flex items-center gap-2"
              onClick={() => toggleFavorite(product?._id!)}
            >
              <i className={`${isFavorite ? "fas" : "far"} fa-heart`}></i>
              <span className="hidden sm:inline">
                {isFavorite ? "Đã yêu thích" : "Yêu thích"}
              </span>
            </button>
          </div>
        </div>
      </div>
     {/* Mô tả sản phẩm */}
<div className="mt-10">
  <h2 className="text-2xl font-semibold mb-5">Mô tả sản phẩm</h2>
  <div className="relative">
    <div
      className={`
        transition-all duration-500 overflow-hidden
        ${showFullDesc ? "max-h-[2000px]" : "max-h-32"}
      `}
    >
      <div
        className="product-description-content text-gray-700" 
        dangerouslySetInnerHTML={{
          __html: (
            showFullDesc || !product?.description || product.description.length <= MAX_DESC_LENGTH
              ? product?.description || ""
              : product?.description.slice(0, MAX_DESC_LENGTH) + "..."
          ),
        }}
      />
    </div>
    {product?.description && product.description.length > MAX_DESC_LENGTH && (
      <div className="flex justify-center mt-3">
        <button
          className="px-4 py-1 rounded-full bg-blue-100 text-blue-700 font-medium hover:bg-blue-200 transition"
          onClick={() => setShowFullDesc((prev) => !prev)}
        >
          {showFullDesc ? "Thu gọn mô tả ▲" : "Xem thêm mô tả ▼"}
        </button>
      </div>
    )}
  </div>
</div>

      {/* Bình luận */}
      <div className="mt-10">
        <h2 className="text-2xl font-semibold mb-5">Đánh giá</h2>
        
        {/* Ô nhập bình luận */}
        <div className="mb-5">
          {(() => {
            // Tìm bình luận của user hiện tại
            const userStr = typeof window !== "undefined" ? localStorage.getItem("user") : null;
            const currentUser = userStr ? JSON.parse(userStr) : null;
            const userComment = comments.find(
              c => c.user_id?._id === currentUser?.id
            );
            if (userComment && userComment.isDeleted === true) {
              return (
                <div className="text-red-600 bg-red-50 p-3 rounded">
                  Đánh giá của bạn đã bị ẩn vì sai quy tắc cộng đồng
                </div>
              );
            }
            if (hasCommented) {
              return (
                <div className="text-yellow-600 bg-yellow-50 p-3 rounded">
                  {commentPermissionMessage}
                </div>
              );
            }
            if (canComment) {
              return (
                <div>
                  <textarea
                    placeholder="Viết bình luận..."
                    className="w-full border rounded p-2"
                    rows={4}
                    value={commentContent}
                    onChange={(e) => setCommentContent(e.target.value)}
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex text-yellow-500 text-3xl">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          onClick={() => setCommentRating(star)}
                          className="cursor-pointer"
                        >
                          {star <= commentRating ? "★" : "☆"}
                        </span>
                      ))}
                    </div>
                    <button
                      onClick={handleSubmitComment}
                      disabled={isSubmitting}
                      className="px-4 py-2 bg-[#16A34A] text-white rounded hover:bg-[#15803D]"
                    >
                      {isSubmitting ? "Đang gửi..." : "Gửi bình luận"}
                    </button>
                  </div>
                </div>
              );
            }
            return (
              <div className="text-red-500">{commentPermissionMessage}</div>
            );
          })()}
        </div>

        {/* Danh sách bình luận */}
        <div className="space-y-4">
          {comments
            .filter(c => c.isDeleted === false) // Chỉ hiển thị bình luận chưa bị xóa
            .slice(0, visibleComments)
            .map((c) => {
              // Lấy và parse thông tin user một lần
              const userStr = localStorage.getItem("user");
              const currentUser = userStr ? JSON.parse(userStr) : null;

              // So sánh ID một cách chính xác hơn
              const isAdmin = currentUser?.role === "admin";
              const isCommentOwner = currentUser?.id === c.user_id?._id;

              console.log("Current user:", currentUser?.id); // Để debug
              console.log("Comment user:", c.user_id?._id); // Để debug

              return (
                <div key={c._id} className="p-4 border rounded-md">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      {/* Avatar tròn */}
                      <img
                        src={
                          c.user_id?.img
                            ? `${IMAGE_USER_URL}/${c.user_id.img}`
                            : "/img/default.png"
                        }
                        alt={c.user_id?.name || "Người dùng"}
                        className="w-8 h-8 rounded-full object-cover border"
                        onError={(e) => { e.currentTarget.src = "/img/default.png"; }}
                      />
                      <span className="font-semibold">{c.user_id?.name || "Người dùng"}</span>
                    </div>
                    {/* Chỉnh sửa điều kiện hiển thị các nút */}
                    {(isCommentOwner || isAdmin) && (
                      <div className="flex gap-2">
                        {isCommentOwner && (
                          <>
                            <button
                              onClick={() => {
                                setEditingComment(c._id);
                                setEditContent(c.content);
                                setEditRating(c.rating); // Add this line
                              }}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            {/* <button
                              onClick={() => handleDeleteComment(c._id)}
                              className="text-red-600 hover:text-red-800"
                              disabled={isDeleting}
                            >
                              <i className="fas fa-trash"></i>
                            </button> */}
                          </>
                        )}
                        {isAdmin && !c.admin_reply && (
                          <button
                            onClick={() => setReplyingId(c._id)}
                            className="text-green-600 hover:text-green-800"
                          >
                            <i className="fas fa-reply"></i>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-500 text-xl">
                      {"★".repeat(c.rating)}
                      {"☆".repeat(5 - c.rating)}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(c.created_at).toLocaleString()}
                    </span>
                  </div>

                  {editingComment === c._id ? (
                    <div className="mt-2">
                      <div className="flex items-center gap-2 mb-2">
                        <span>Đánh giá: </span>
                        <div className="flex text-yellow-500 text-xl">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span
                              key={star}
                              onClick={() => setEditRating(star)}
                              className="cursor-pointer"
                            >
                              {star <= editRating ? "★" : "☆"}
                            </span>
                          ))}
                        </div>
                      </div>
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full border rounded p-2"
                        rows={3}
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => handleEditComment(c._id)}
                          className="px-3 py-1 bg-blue-600 text-white rounded"
                        >
                          Lưu
                        </button>
                        <button
                          onClick={() => {
                            setEditingComment(null);
                            setEditContent("");
                            setEditRating(0); // Reset rating
                          }}
                          className="px-3 py-1 bg-gray-600 text-white rounded"
                        >
                          Hủy
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>{c.content}</div>
                  )}

                {c.admin_reply && (
                  <div className="mt-2 p-2 bg-gray-100 border-l-4 border-green-600 rounded">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-green-700">
                        Admin phản hồi:
                      </span>
                      {isAdmin && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingReply(c._id);
                              setEditReplyContent(c.admin_reply || "");
                            }}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            onClick={() => handleDeleteReply(c._id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      )}
                    </div>

                    {editingReply === c._id ? (
                      <div className="mt-2">
                        <textarea
                          value={editReplyContent}
                          onChange={(e) => setEditReplyContent(e.target.value)}
                          className="w-full border rounded p-2"
                          rows={3}
                        />
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => handleEditReply(c._id)}
                            className="px-3 py-1 bg-blue-600 text-white rounded"
                          >
                            Lưu
                          </button>
                          <button
                            onClick={() => {
                              setEditingReply(null);
                              setEditReplyContent("");
                            }}
                            className="px-3 py-1 bg-gray-600 text-white rounded"
                          >
                            Hủy
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-1">{c.admin_reply}</div>
          )}
                  </div>
                )}

                {replyingId === c._id && isAdmin && (
                  <div className="mt-2">
                    <textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      className="w-full border rounded p-2"
                      rows={3}
                      placeholder="Nhập phản hồi..."
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                      >
                        Gửi phản hồi
                      </button>
                      <button
                        onClick={() => {
                          setReplyingId(null);
                          setReplyContent("");
                        }}
                        className="px-3 py-1 bg-gray-600 text-white rounded"
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
      </div>

      

      {/* Câu hỏi về sản phẩm */}
      <div className="mt-10">
        <h2 className="text-2xl font-semibold mb-5">Câu hỏi về sản phẩm</h2>

        {/* Form đặt câu hỏi */}
        <div className="mb-8">
          <textarea
            placeholder="Đặt câu hỏi về sản phẩm..."
            className="w-full border rounded p-2"
            rows={3}
            value={newQuestionContent}
            onChange={(e) => setNewQuestionContent(e.target.value)}
          />
          <button
            onClick={handleSubmitQuestion}
            disabled={isSubmittingQuestion}
            className="mt-2 px-4 py-2 bg-[#16A34A] text-white rounded hover:bg-[#15803D]"
          >
            {isSubmittingQuestion ? "Đang gửi..." : "Gửi câu hỏi"}
          </button>
        </div>

        {/* Danh sách câu hỏi */}
   <div className="space-y-4">
  {questions
    .filter(q => q.isVisible === true) // Chỉ hiển thị câu hỏi được phép hiện
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, visibleQuestions)
    .map((question) => {
      const userStr = typeof window !== "undefined" ? localStorage.getItem("user") : null;
      const currentUser = userStr ? JSON.parse(userStr) : null;
      const isAdmin = currentUser?.role === "admin";
            

            return (
              <div key={question._id} className="border-b py-4">
                <QuestionThread
                  question={question}
                  currentUser={currentUser}
                  isAdmin={isAdmin}
                  onReply={onReply}
                  onDelete={handleDeleteQuestion}
                  replyingToQuestionId={replyingToQuestionId}
                  setReplyingToQuestionId={setReplyingToQuestionId}
                  handleSubmitAnswer={handleSubmitAnswer}
                  visibleAnswers={visibleAnswers}
                  setVisibleAnswers={setVisibleAnswers}
                />
              </div>
            );
          })}
        </div>

        {/* Nút xem thêm câu hỏi */}
        {questions.filter(q => q.isVisible === true).length > visibleQuestions && (
          <button
            onClick={() => setVisibleQuestions(prev => prev + 5)}
            className="mt-4 w-full py-2 text-blue-600 hover:text-blue-800 text-center"
          >
            Xem thêm câu hỏi
          </button>
        )}
      </div>

      {/* Sản phẩm liên quan */}
      <div className="mt-10">
        <h2 className="text-2xl font-semibold mb-5">Sản phẩm liên quan</h2>
        <div className="relative flex items-center">
          {/* Nút mũi tên trái */}
          <button
            className="absolute left-0 z-10 bg-white border rounded-full w-10 h-10 flex items-center justify-center shadow hover:bg-gray-100 disabled:opacity-50"
            onClick={() => {
              const container = document.getElementById("related-scroll");
              if (container) container.scrollBy({ left: -320, behavior: "smooth" });
            }}
            style={{ top: "50%", transform: "translateY(-50%)" }}
          >
            <i className="fas fa-chevron-left"></i>
          </button>

          {/* Slide sản phẩm - scroll ngang */}
          <div
            id="related-scroll"
            className="flex gap-5 overflow-x-auto px-12 pb-2 scroll-smooth"
            style={{ scrollSnapType: "x mandatory" }}
          >
            {relatedProducts.map((rp) => {
              const variant = rp.variants && rp.variants.length > 0 ? rp.variants[0] : null;
              return (
                <div
                  key={rp._id}
                  className="relative border border-gray-300 rounded-lg p-3 bg-white shadow-md text-center font-sans w-[300px] flex-shrink-0"
                  style={{ scrollSnapAlign: "start" }}
                >
                  {/* Hot Icon */}
                  {rp.hot === 1 && (
                    <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 rounded-md text-xs font-bold z-20 flex items-center gap-1">
                      <i className="fas fa-fire"></i>
                      HOT
                    </div>
                  )}

                  {/* Product Image Container */}
                  <div className="w-full h-[250px] flex items-center justify-center bg-white">
                    <img
                      src={`${IMAGE_URL}/${rp.images_main}`}
                      alt={rp.name}
                      className="max-h-full object-contain"
                    />
                  </div>

                  {/* Product Info */}
                  <div className="text-base font-bold mb-1.5 h-12 overflow-hidden">
                    {rp.name}
                  </div>

                  <div className="text-base text-gray-700 mb-2.5">
                    {variant ? (
                      rp.flashSalePrice !== undefined && rp.flashSalePrice !== null && rp.flashSalePrice < variant.cost_price ? (
                        <>
                          <span className="text-red-600 font-bold">{Number(rp.flashSalePrice).toLocaleString()}đ</span>
                          <span className="text-gray-500 line-through text-sm ml-2">{variant.cost_price.toLocaleString()}đ</span>
                          <span className="ml-2 text-xs font-bold text-orange-600 bg-orange-100 rounded px-2 py-0.5">
                            -{Math.round(100 - (rp.flashSalePrice / variant.cost_price) * 100)}%
                          </span>
                        </>
                      ) : (
                        <span className="text-red-600 font-bold">{variant.cost_price.toLocaleString()}đ</span>
                      )
                    ) : (
                      <span>Liên hệ</span>
                    )}
                    <span className="text-gray-600 ml-1">
                      |{" "}
                      {rp.status === "active" || rp.status === "Hot"
                        ? "Còn hàng"
                        : "Hết hàng"}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-between items-center gap-2">
                    <button
                      onClick={() => router.push(`/detail/${rp._id}`)}
                      className="flex-1 text-center text-white bg-green-700 px-3 py-2 rounded-md"
                    >
                      Mua
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Nút mũi tên phải */}
          <button
            className="absolute right-0 z-10 bg-white border rounded-full w-10 h-10 flex items-center justify-center shadow hover:bg-gray-100 disabled:opacity-50"
            onClick={() => {
              const container = document.getElementById("related-scroll");
              if (container) container.scrollBy({ left: 320, behavior: "smooth" });
            }}
            style={{ top: "50%", transform: "translateY(-50%)" }}
          >
            <i className="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>
    </div>
      {/* Nút Chatbot mới: Sử dụng component ChatbotButton */}
      <ChatbotButton setShowChat={setShowChat} />

      {/* Giao diện Chatbot Popup vẫn giữ nguyên */}
      <ChatbotPopup showChat={showChat} setShowChat={setShowChat} />
    <Footer />
</>
  );
};
export default Detail;
interface CartItem {
  _id: string;
  productId: string;
  variantId: string;
  quantity: number;
  note: string;
  productName: string;
  productImage: string;
  variantDetails: {
    _id: string;
    size: string;
    color: string;
    cost_price: number;
    cost_sale: number;
    image: string;
  };
}

// Thêm function kiểm tra xem variant có đang trong đợt flash sale hay không
// Lấy danh sách flash sale đang diễn ra khi trang load


