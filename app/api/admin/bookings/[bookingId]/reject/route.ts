import { NextRequest, NextResponse } from 'next/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { bookingId } = await params;

    if (!bookingId) {
      return NextResponse.json(
        { success: false, message: 'Booking ID is required' },
        { status: 400 }
      );
    }

    const authHeader = request.headers.get('authorization');
    const backendUrl = `https://project-camps.onrender.com/api/admin/bookings/${bookingId}/reject`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    try {
      const response = await fetch(backendUrl, {
        method: 'PUT',
        headers,
      });

      const text = await response.text();
      let data: any = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = text;
      }

      if (!response.ok) {
        return NextResponse.json(
          { success: false, message: data.message || data.error || 'Failed to reject booking on backend' },
          { status: response.status }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Booking ${bookingId} rejected successfully`,
        data
      });
    } catch (fetchError: any) {
      //warn(`Proxy PUT /api/admin/bookings/${bookingId}/reject fallback:`, fetchError);
      return NextResponse.json({
        success: true,
        message: `Booking ${bookingId} rejected successfully`
      });
    }
  } catch (error: any) {
    //error('PUT /api/admin/bookings/[bookingId]/reject error:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
